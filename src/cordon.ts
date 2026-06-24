import { hashString, mulberry32 } from "./seed";
import { ribbonPaths } from "./geometry";

export interface TapeCordonColors {
  /** Main tape body colour. */
  tape: string;
  /** Highlight band through the tape middle. */
  tapeHighlight: string;
  /** Lower edge shadow colour. */
  tapeShadow: string;
  /** Tape outline / edge stroke. */
  edge: string;
  /** Warning text colour. */
  text: string;
  /** Scrim that dims the content behind the cordon. */
  scrim: string;
  /** Blade stroke colour while slicing. */
  slice: string;
  /** Glow around the blade stroke. */
  sliceGlow: string;
}

export interface TapeCordonOptions {
  /** Deterministic layout seed (e.g. a page URL). Same seed → same arrangement. Default "". */
  seed?: string;
  /** Strip `?query` and `#hash` from the seed before hashing. Default true. */
  stripQuery?: boolean;
  /** Repeated warning text that flows along each tape. */
  message?: string;
  /** Inclusive range for the seeded tape count. Defaults 5 / 8. */
  minTapes?: number;
  maxTapes?: number;
  /** Verlet nodes per tape (resolution of the ribbon). Default 20. */
  nodes?: number;
  /** Nodes glued flat at each anchored end, so cut tape stays flush/attached rather than hinging at the corner. Default 3. */
  adhere?: number;
  /** Physics tuning. */
  gravity?: number;
  damping?: number;
  iterations?: number;
  /** Allow drag-to-cut. Default true. */
  cuttable?: boolean;
  /** Hit radius (px) for the slice stroke. Default 34. */
  cutRadius?: number;
  /** Persist cuts to localStorage. Default true. */
  persist?: boolean;
  /** Storage-key builder. Default `seed => "slop-tape:" + seed`. */
  storageKey?: (seed: string) => string;
  /** Dim the content behind the cordon. Default true. */
  scrim?: boolean;
  /** Overlay z-index. Default 40. */
  zIndex?: number;
  /** Honour prefers-reduced-motion (no physics, instant gap). `"auto"` | boolean. Default "auto". */
  reducedMotion?: boolean | "auto";
  /** Font for the warning text. */
  fontFamily?: string;
  letterSpacing?: string;
  colors?: Partial<TapeCordonColors>;
  /** Fired after each successful cut. */
  onCut?: (info: { index: number; cutCount: number; total: number }) => void;
  /** Fired once every tape on the page has been cut. */
  onCleared?: () => void;
}

type ResolvedOptions = Required<
  Omit<TapeCordonOptions, "colors" | "storageKey" | "onCut" | "onCleared">
> & {
  colors: TapeCordonColors;
  storageKey: (seed: string) => string;
  onCut?: TapeCordonOptions["onCut"];
  onCleared?: TapeCordonOptions["onCleared"];
};

interface PhysNode {
  x: number;
  y: number;
  px: number;
  py: number;
  pin: boolean;
}

interface Piece {
  s: number;
  e: number;
  ribbon: SVGPathElement;
  centerline: SVGPathElement;
}

interface Tape {
  index: number;
  nodes: PhysNode[];
  links: boolean[];
  rest: number;
  total: number;
  height: number;
  /** -1 while uncut; the severed link index once cut. */
  cutLink: number;
  group: SVGGElement;
  pieces: (Piece | null)[];
}

const SVGNS = "http://www.w3.org/2000/svg";
const XLINK = "http://www.w3.org/1999/xlink";
const DT = 1 / 60;

const DEFAULT_COLORS: TapeCordonColors = {
  tape: "#f5d800",
  tapeHighlight: "#ffe000",
  tapeShadow: "#d9c000",
  edge: "#0a0a0a",
  text: "#0a0a0a",
  scrim: "rgba(8,6,12,0.55)",
  slice: "#ffffff",
  sliceGlow: "rgba(239,83,80,0.95)",
};

let instanceCounter = 0;

/**
 * A physics crime-scene tape cordon you can sling across any element and cut
 * through. Layout is seeded from a string (so it's stable per page); cut tapes
 * fall, swing, and pool under gravity; cuts persist per seed.
 *
 * ```ts
 * const cordon = new TapeCordon(container, { seed: location.pathname });
 * cordon.mount();
 * ```
 */
export class TapeCordon {
  private readonly container: HTMLElement;
  private readonly o: ResolvedOptions;
  private readonly id = ++instanceCounter;

  private root!: HTMLDivElement;
  private cordonSVG!: SVGSVGElement;
  private sliceSVG!: SVGSVGElement;
  private slicePoly!: SVGPolylineElement;

  private tapes: Tape[] = [];
  private cuts = new Set<number>();
  private count = 0;
  private seedRoute = "";
  private w = 0;
  private h = 0;

  private raf: number | null = null;
  private idleFrames = 0;
  private slicing = false;
  private stroke: { x: number; y: number }[] = [];
  private reduce = false;
  private mounted = false;
  private resizeObserver?: ResizeObserver;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(container: HTMLElement, options: TapeCordonOptions = {}) {
    this.container = container;
    this.o = {
      seed: options.seed ?? "",
      stripQuery: options.stripQuery ?? true,
      message:
        options.message ?? "AI SLOP POLICE · INVESTIGATION IN PROGRESS · DO NOT ENTER · ",
      minTapes: options.minTapes ?? 5,
      maxTapes: options.maxTapes ?? 8,
      nodes: options.nodes ?? 20,
      adhere: options.adhere ?? 3,
      gravity: options.gravity ?? 2600,
      damping: options.damping ?? 0.9,
      iterations: options.iterations ?? 12,
      cuttable: options.cuttable ?? true,
      cutRadius: options.cutRadius ?? 34,
      persist: options.persist ?? true,
      storageKey: options.storageKey ?? ((seed) => `slop-tape:${seed}`),
      scrim: options.scrim ?? true,
      zIndex: options.zIndex ?? 40,
      reducedMotion: options.reducedMotion ?? "auto",
      fontFamily:
        options.fontFamily ?? '"Arial Narrow","Helvetica Neue",Helvetica,Arial,sans-serif',
      letterSpacing: options.letterSpacing ?? "0.14em",
      colors: { ...DEFAULT_COLORS, ...(options.colors ?? {}) },
      onCut: options.onCut,
      onCleared: options.onCleared,
    };
  }

  // ---- public API ----------------------------------------------------------

  /** Number of tapes cut on the current page. */
  get cutCount(): number {
    return this.cuts.size;
  }

  /** Total tapes the current seed produced. */
  get total(): number {
    return this.count;
  }

  /** True once every tape on the page has been cut. */
  get isCleared(): boolean {
    return this.count > 0 && this.cuts.size >= this.count;
  }

  /** Build the overlay and start. No-op on the server or if already mounted. */
  mount(): this {
    if (typeof window === "undefined" || this.mounted) return this;

    this.reduce =
      this.o.reducedMotion === "auto"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : this.o.reducedMotion;

    if (getComputedStyle(this.container).position === "static") {
      this.container.style.position = "relative";
    }

    const root = document.createElement("div");
    root.className = "slop-tape-root";
    root.style.cssText = `position:absolute;inset:0;width:100%;height:100%;overflow:hidden;z-index:${this.o.zIndex};`;
    this.root = root;

    this.cordonSVG = document.createElementNS(SVGNS, "svg");
    this.cordonSVG.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;";
    this.cordonSVG.innerHTML =
      `<defs><linearGradient id="slop-haz-${this.id}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${this.o.colors.tape}"/>` +
      `<stop offset="0.5" stop-color="${this.o.colors.tapeHighlight}"/>` +
      `<stop offset="1" stop-color="${this.o.colors.tapeShadow}"/></linearGradient></defs>`;

    this.sliceSVG = document.createElementNS(SVGNS, "svg");
    this.sliceSVG.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:2;";
    this.slicePoly = document.createElementNS(SVGNS, "polyline");
    this.slicePoly.setAttribute("fill", "none");
    this.slicePoly.setAttribute("stroke", this.o.colors.slice);
    this.slicePoly.setAttribute("stroke-width", "2.5");
    this.slicePoly.setAttribute("stroke-linecap", "round");
    this.slicePoly.setAttribute("stroke-linejoin", "round");
    this.slicePoly.style.filter = `drop-shadow(0 0 5px ${this.o.colors.sliceGlow})`;
    this.sliceSVG.appendChild(this.slicePoly);

    root.append(this.cordonSVG, this.sliceSVG);
    this.container.appendChild(root);

    if (this.o.cuttable) {
      root.addEventListener("pointerdown", this.onPointerDown);
      window.addEventListener("pointermove", this.onPointerMove);
      window.addEventListener("pointerup", this.onPointerUp);
    }

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);

    this.mounted = true;
    this.build();
    return this;
  }

  /** Change the seed (e.g. on SPA navigation) and re-lay the cordon. */
  setSeed(seed: string): this {
    this.o.seed = seed;
    if (this.mounted) this.build();
    return this;
  }

  /** Clear persisted cuts for the current seed and re-tape. */
  reset(): this {
    if (this.o.persist && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(this.o.storageKey(this.seedRoute));
      } catch {
        /* private mode / quota */
      }
    }
    this.cuts.clear();
    if (this.mounted) this.build();
    return this;
  }

  /** Programmatically cut every remaining tape. */
  cutAll(): this {
    const mid = 1 + Math.floor(this.o.nodes / 2);
    for (const t of this.tapes) if (t.cutLink === -1) this.sever(t, mid);
    return this;
  }

  /** Tear everything down and remove the overlay. */
  destroy(): void {
    if (!this.mounted) return;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.root.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    this.resizeObserver?.disconnect();
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.root.remove();
    this.mounted = false;
  }

  // ---- layout / build ------------------------------------------------------

  private resolveSeed(seed: string): string {
    return this.o.stripQuery ? seed.split("?")[0].split("#")[0] : seed;
  }

  private loadCuts(route: string): Set<number> {
    if (!this.o.persist || typeof localStorage === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(this.o.storageKey(route));
      return new Set(raw ? (JSON.parse(raw) as number[]) : []);
    } catch {
      return new Set();
    }
  }

  private saveCuts(): void {
    if (!this.o.persist || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(this.o.storageKey(this.seedRoute), JSON.stringify([...this.cuts]));
    } catch {
      /* private mode / quota */
    }
  }

  private build(): void {
    this.seedRoute = this.resolveSeed(this.o.seed);
    const hash = hashString(this.seedRoute);
    const rng = mulberry32(hash);
    const span = this.o.maxTapes - this.o.minTapes + 1;
    this.count = this.o.minTapes + Math.floor(rng() * span);

    this.w = this.root.clientWidth || this.container.clientWidth;
    this.h = this.root.clientHeight || this.container.clientHeight;
    this.cuts = this.loadCuts(this.seedRoute);

    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.cordonSVG.querySelectorAll("g[data-tape]").forEach((g) => g.remove());
    this.tapes = [];

    const N = this.o.nodes;
    for (let i = 0; i < this.count; i++) {
      const band = (i + 0.5) / this.count;
      const yFrac = band + (rng() * 2 - 1) * 0.06;
      const rot = (rng() * 2 - 1) * 16;
      const height = 34 + rng() * 20;
      const tape = this.makeTape(i, yFrac, rot, height);
      if (this.cuts.has(i)) {
        const lk = 1 + (hashString(`${this.seedRoute}:${i}`) % (N - 2));
        tape.cutLink = lk;
        tape.links[lk] = false;
      }
      this.buildGroup(tape);
      this.tapes.push(tape);
    }

    // pre-settle persisted cuts so they load already dangling
    for (let s = 0; s < 260; s++) {
      for (const t of this.tapes) if (t.cutLink >= 0) this.step(t);
    }
    for (const t of this.tapes) this.draw(t);

    this.updateInteractivity();
    if (!this.reduce && this.tapes.some((t) => t.cutLink >= 0)) this.kick();
  }

  private makeTape(index: number, yFrac: number, rot: number, height: number): Tape {
    const N = this.o.nodes;
    const cx = this.w / 2;
    const cy = Math.max(18, Math.min(this.h - 18, yFrac * this.h));
    const slope = Math.tan((rot * Math.PI) / 180);
    const ax = 4;
    const bx = this.w - 4;
    const a = { x: ax, y: cy + slope * (ax - cx) };
    const b = { x: bx, y: cy + slope * (bx - cx) };

    const adhere = Math.max(1, Math.min(this.o.adhere, Math.floor(N / 2)));
    const nodes: PhysNode[] = [];
    let total = 0;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      // glue a run of nodes at each anchored end so cut tape stays flush, not hinged at the corner
      nodes.push({ x, y, px: x, py: y, pin: i < adhere || i >= N - adhere });
      if (i > 0) total += Math.hypot(nodes[i].x - nodes[i - 1].x, nodes[i].y - nodes[i - 1].y);
    }
    const links = new Array<boolean>(N - 1).fill(true);
    const group = document.createElementNS(SVGNS, "g");
    group.setAttribute("data-tape", String(index));
    return { index, nodes, links, rest: total / (N - 1), total, height, cutLink: -1, group, pieces: [] };
  }

  private pieceRanges(t: Tape): [number, number][] {
    const N = this.o.nodes;
    const ranges: [number, number][] = [];
    let start = 0;
    for (let i = 0; i < N - 1; i++) {
      if (!t.links[i]) {
        ranges.push([start, i]);
        start = i + 1;
      }
    }
    ranges.push([start, N - 1]);
    return ranges;
  }

  private buildGroup(t: Tape): void {
    this.cordonSVG.appendChild(t.group);
    this.rebuildPieces(t);
  }

  private rebuildPieces(t: Tape): void {
    while (t.group.firstChild) t.group.removeChild(t.group.firstChild);
    t.pieces = [];
    const fs = t.height * 0.5;
    const reps = Math.max(8, Math.ceil(t.total / (this.o.message.length * t.height * 0.3)));
    const full = this.o.message.repeat(reps);

    this.pieceRanges(t).forEach(([s, e], pi) => {
      if (e <= s) {
        t.pieces.push(null);
        return;
      }
      const clId = `slop-cl-${this.id}-${t.index}-${pi}`;
      const ribbon = document.createElementNS(SVGNS, "path");
      ribbon.setAttribute("fill", `url(#slop-haz-${this.id})`);
      ribbon.setAttribute("stroke", this.o.colors.edge);
      ribbon.setAttribute("stroke-width", "2");
      ribbon.setAttribute("stroke-linejoin", "round");
      ribbon.setAttribute("stroke-linecap", "round");

      const centerline = document.createElementNS(SVGNS, "path");
      centerline.setAttribute("id", clId);
      centerline.setAttribute("fill", "none");
      centerline.setAttribute("stroke", "none");

      const text = document.createElementNS(SVGNS, "text");
      text.setAttribute("font-size", String(fs));
      text.setAttribute("font-weight", "700");
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("fill", this.o.colors.text);
      text.style.fontFamily = this.o.fontFamily;
      text.style.letterSpacing = this.o.letterSpacing;
      text.style.userSelect = "none";

      const tp = document.createElementNS(SVGNS, "textPath");
      tp.setAttribute("href", `#${clId}`);
      tp.setAttributeNS(XLINK, "href", `#${clId}`);
      tp.textContent = full;
      text.appendChild(tp);

      t.group.append(ribbon, centerline, text);
      t.pieces.push({ s, e, ribbon, centerline });
    });
  }

  // ---- physics -------------------------------------------------------------

  private step(t: Tape): void {
    const { gravity, damping, iterations } = this.o;
    for (const n of t.nodes) {
      if (n.pin) continue;
      const vx = (n.x - n.px) * damping;
      const vy = (n.y - n.py) * damping;
      n.px = n.x;
      n.py = n.y;
      n.x += vx;
      n.y += vy + gravity * DT * DT;
    }

    const N = this.o.nodes;
    for (let k = 0; k < iterations; k++) {
      for (let i = 0; i < N - 1; i++) {
        if (!t.links[i]) continue;
        const a = t.nodes[i];
        const b = t.nodes[i + 1];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const diff = ((d - t.rest) / d) * 0.5;
        dx *= diff;
        dy *= diff;
        if (!a.pin) {
          a.x += dx;
          a.y += dy;
        }
        if (!b.pin) {
          b.x -= dx;
          b.y -= dy;
        }
      }
    }

    // boundary collision — keep nodes on-screen so cut ends dangle & pool, never vanish
    const ht = t.height / 2;
    for (const n of t.nodes) {
      if (n.pin) continue;
      if (n.x < ht) {
        n.x = ht;
        n.px = n.x + (n.x - n.px) * 0.4;
      } else if (n.x > this.w - ht) {
        n.x = this.w - ht;
        n.px = n.x + (n.x - n.px) * 0.4;
      }
      if (n.y > this.h - ht) {
        n.y = this.h - ht;
        n.px = n.x + (n.x - n.px) * 0.5;
        n.py = n.y;
      } else if (n.y < ht) {
        n.y = ht;
      }
    }
  }

  private draw(t: Tape): number {
    for (const pc of t.pieces) {
      if (!pc) continue;
      const { fill, center } = ribbonPaths(t.nodes.slice(pc.s, pc.e + 1), t.height);
      pc.ribbon.setAttribute("d", fill);
      pc.centerline.setAttribute("d", center);
    }
    let moved = 0;
    for (const n of t.nodes) if (!n.pin) moved += Math.abs(n.x - n.px) + Math.abs(n.y - n.py);
    return moved;
  }

  private frame = (): void => {
    let moving = 0;
    for (const t of this.tapes) {
      if (t.cutLink < 0) continue; // uncut tapes stay tightly wrapped
      this.step(t);
      moving += this.draw(t);
    }
    if (moving < 0.4) this.idleFrames++;
    else this.idleFrames = 0;
    if (this.idleFrames > 20) {
      this.raf = null;
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private kick(): void {
    this.idleFrames = 0;
    if (this.raf === null && !this.reduce) this.raf = requestAnimationFrame(this.frame);
  }

  // ---- cutting -------------------------------------------------------------

  private sever(t: Tape, nodeIdx: number): boolean {
    if (t.cutLink !== -1) return false;
    const N = this.o.nodes;
    const link = Math.max(1, Math.min(N - 2, nodeIdx)); // never sever a pinned end
    t.cutLink = link;
    t.links[link] = false;
    this.rebuildPieces(t);
    this.draw(t);
    this.cuts.add(t.index);
    this.saveCuts();
    this.o.onCut?.({ index: t.index, cutCount: this.cuts.size, total: this.count });
    if (this.isCleared) {
      this.updateInteractivity();
      this.o.onCleared?.();
    }
    return true;
  }

  private commitSlice(): void {
    const N = this.o.nodes;
    const R = this.o.cutRadius;
    for (const t of this.tapes) {
      if (t.cutLink !== -1) continue;
      const near = this.stroke.filter((p) => {
        let dmin = Infinity;
        for (let i = 1; i < N - 1; i++) {
          const n = t.nodes[i];
          const d = Math.hypot(n.x - p.x, n.y - p.y);
          if (d < dmin) dmin = d;
        }
        return dmin < R;
      });
      if (!near.length) continue;
      const ax = near.reduce((s, p) => s + p.x, 0) / near.length;
      const ay = near.reduce((s, p) => s + p.y, 0) / near.length;
      let best = 1;
      let bd = Infinity;
      for (let i = 1; i < N - 1; i++) {
        const n = t.nodes[i];
        const d = Math.hypot(n.x - ax, n.y - ay);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      if (this.sever(t, best) && !this.reduce) this.kick();
    }
  }

  private toLocal(e: PointerEvent): { x: number; y: number } {
    const r = this.root.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private drawStroke(): void {
    this.slicePoly.setAttribute("points", this.stroke.map((p) => `${p.x},${p.y}`).join(" "));
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.isCleared) return;
    this.slicing = true;
    this.root.setPointerCapture?.(e.pointerId);
    this.stroke = [this.toLocal(e)];
    this.drawStroke();
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.slicing) return;
    this.stroke.push(this.toLocal(e));
    this.drawStroke();
  };

  private onPointerUp = (): void => {
    if (!this.slicing) return;
    this.slicing = false;
    this.commitSlice();
    this.stroke = [];
    this.slicePoly.setAttribute("points", "");
  };

  private updateInteractivity(): void {
    const cleared = this.isCleared;
    const interactive = this.o.cuttable && !cleared;
    this.root.style.pointerEvents = interactive ? "auto" : "none";
    this.root.style.cursor = interactive ? "crosshair" : "";
    this.root.style.background = this.o.scrim && !cleared ? this.o.colors.scrim : "transparent";
  }

  private onResize(): void {
    if (!this.mounted) return;
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => this.build(), 150);
  }
}
