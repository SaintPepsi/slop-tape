function b(p) {
  let t = 2166136261;
  for (let e = 0; e < p.length; e++)
    t ^= p.charCodeAt(e), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function C(p) {
  let t = p >>> 0;
  return () => {
    t = t + 1831565813 | 0;
    let e = Math.imul(t ^ t >>> 15, 1 | t);
    return e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, ((e ^ e >>> 14) >>> 0) / 4294967296;
  };
}
function N(p, t) {
  const e = t / 2, o = p.length, n = [], s = [], u = [];
  for (let i = 0; i < o; i++) {
    const a = p[i], c = p[Math.max(0, i - 1)], r = p[Math.min(o - 1, i + 1)];
    let h = r.x - c.x, d = r.y - c.y;
    const l = Math.hypot(h, d) || 1;
    h /= l, d /= l;
    const f = -d, y = h;
    n.push(`${(a.x + f * e).toFixed(1)} ${(a.y + y * e).toFixed(1)}`), s.push(`${(a.x - f * e).toFixed(1)} ${(a.y - y * e).toFixed(1)}`), u.push(`${a.x.toFixed(1)} ${a.y.toFixed(1)}`);
  }
  return s.reverse(), {
    fill: `M${n.join(" L")} L${s.join(" L")} Z`,
    center: `M${u.join(" L")}`
  };
}
const x = "http://www.w3.org/2000/svg", P = "http://www.w3.org/1999/xlink", A = 1 / 60, T = {
  tape: "#f5d800",
  tapeHighlight: "#ffe000",
  tapeShadow: "#d9c000",
  edge: "#0a0a0a",
  text: "#0a0a0a",
  scrim: "rgba(8,6,12,0.55)",
  slice: "#ffffff",
  sliceGlow: "rgba(239,83,80,0.95)"
};
let $ = 0;
class E {
  constructor(t, e = {}) {
    this.id = ++$, this.tapes = [], this.cutLinks = /* @__PURE__ */ new Map(), this.count = 0, this.seedRoute = "", this.w = 0, this.h = 0, this.raf = null, this.idleFrames = 0, this.slicing = !1, this.stroke = [], this.reduce = !1, this.mounted = !1, this.resizeTimer = null, this.frame = () => {
      let o = 0;
      for (const n of this.tapes)
        n.cutLink < 0 || (this.step(n), o += this.draw(n));
      if (o < 0.4 ? this.idleFrames++ : this.idleFrames = 0, this.idleFrames > 20) {
        this.raf = null;
        return;
      }
      this.raf = requestAnimationFrame(this.frame);
    }, this.onPointerDown = (o) => {
      var n, s;
      this.isCleared || (this.slicing = !0, (s = (n = this.root).setPointerCapture) == null || s.call(n, o.pointerId), this.stroke = [this.toLocal(o)], this.drawStroke());
    }, this.onPointerMove = (o) => {
      this.slicing && (this.stroke.push(this.toLocal(o)), this.drawStroke());
    }, this.onPointerUp = () => {
      this.slicing && (this.slicing = !1, this.commitSlice(), this.stroke = [], this.slicePoly.setAttribute("points", ""));
    }, this.container = t, this.o = {
      seed: e.seed ?? "",
      stripQuery: e.stripQuery ?? !0,
      message: e.message ?? "AI SLOP POLICE · INVESTIGATION IN PROGRESS · DO NOT ENTER · ",
      minTapes: e.minTapes ?? 5,
      maxTapes: e.maxTapes ?? 8,
      nodes: e.nodes ?? 20,
      adhere: e.adhere ?? 3,
      gravity: e.gravity ?? 2600,
      damping: e.damping ?? 0.9,
      iterations: e.iterations ?? 12,
      cuttable: e.cuttable ?? !0,
      cutRadius: e.cutRadius ?? 34,
      persist: e.persist ?? !0,
      storageKey: e.storageKey ?? ((o) => `slop-tape:${o}`),
      scrim: e.scrim ?? !0,
      zIndex: e.zIndex ?? 40,
      clearedOpacity: e.clearedOpacity ?? 0.7,
      reducedMotion: e.reducedMotion ?? "auto",
      fontFamily: e.fontFamily ?? '"Arial Narrow","Helvetica Neue",Helvetica,Arial,sans-serif',
      letterSpacing: e.letterSpacing ?? "0.14em",
      colors: { ...T, ...e.colors ?? {} },
      onCut: e.onCut,
      onCleared: e.onCleared
    };
  }
  // ---- public API ----------------------------------------------------------
  /** Number of tapes cut on the current page. */
  get cutCount() {
    return this.cutLinks.size;
  }
  /** Total tapes the current seed produced. */
  get total() {
    return this.count;
  }
  /** True once every tape on the page has been cut. */
  get isCleared() {
    return this.count > 0 && this.cutLinks.size >= this.count;
  }
  /** Build the overlay and start. No-op on the server or if already mounted. */
  mount() {
    if (typeof window > "u" || this.mounted) return this;
    this.reduce = this.o.reducedMotion === "auto" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : this.o.reducedMotion, getComputedStyle(this.container).position === "static" && (this.container.style.position = "relative");
    const t = document.createElement("div");
    return t.className = "slop-tape-root", t.style.cssText = `position:absolute;inset:0;width:100%;height:100%;overflow:hidden;z-index:${this.o.zIndex};`, this.root = t, this.cordonSVG = document.createElementNS(x, "svg"), this.cordonSVG.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;", this.cordonSVG.innerHTML = `<defs><linearGradient id="slop-haz-${this.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${this.o.colors.tape}"/><stop offset="0.5" stop-color="${this.o.colors.tapeHighlight}"/><stop offset="1" stop-color="${this.o.colors.tapeShadow}"/></linearGradient></defs>`, this.sliceSVG = document.createElementNS(x, "svg"), this.sliceSVG.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:2;", this.slicePoly = document.createElementNS(x, "polyline"), this.slicePoly.setAttribute("fill", "none"), this.slicePoly.setAttribute("stroke", this.o.colors.slice), this.slicePoly.setAttribute("stroke-width", "2.5"), this.slicePoly.setAttribute("stroke-linecap", "round"), this.slicePoly.setAttribute("stroke-linejoin", "round"), this.slicePoly.style.filter = `drop-shadow(0 0 5px ${this.o.colors.sliceGlow})`, this.sliceSVG.appendChild(this.slicePoly), t.append(this.cordonSVG, this.sliceSVG), this.container.appendChild(t), this.o.cuttable && (t.addEventListener("pointerdown", this.onPointerDown), window.addEventListener("pointermove", this.onPointerMove), window.addEventListener("pointerup", this.onPointerUp)), this.resizeObserver = new ResizeObserver(() => this.onResize()), this.resizeObserver.observe(this.container), this.mounted = !0, this.build(), this;
  }
  /** Change the seed (e.g. on SPA navigation) and re-lay the cordon. */
  setSeed(t) {
    return this.o.seed = t, this.mounted && this.build(), this;
  }
  /** Clear persisted cuts for the current seed and re-tape. */
  reset() {
    if (this.o.persist && typeof localStorage < "u")
      try {
        localStorage.removeItem(this.o.storageKey(this.seedRoute));
      } catch {
      }
    return this.cutLinks.clear(), this.mounted && this.build(), this;
  }
  /** Programmatically cut every remaining tape. */
  cutAll() {
    const t = 1 + Math.floor(this.o.nodes / 2);
    for (const e of this.tapes) e.cutLink === -1 && this.sever(e, t);
    return this;
  }
  /** Tear everything down and remove the overlay. */
  destroy() {
    var t;
    this.mounted && (this.raf && cancelAnimationFrame(this.raf), this.raf = null, this.root.removeEventListener("pointerdown", this.onPointerDown), window.removeEventListener("pointermove", this.onPointerMove), window.removeEventListener("pointerup", this.onPointerUp), (t = this.resizeObserver) == null || t.disconnect(), this.resizeTimer && clearTimeout(this.resizeTimer), this.root.remove(), this.mounted = !1);
  }
  // ---- layout / build ------------------------------------------------------
  resolveSeed(t) {
    return this.o.stripQuery ? t.split("?")[0].split("#")[0] : t;
  }
  loadCuts(t) {
    const e = /* @__PURE__ */ new Map();
    if (!this.o.persist || typeof localStorage > "u") return e;
    try {
      const o = localStorage.getItem(this.o.storageKey(t));
      if (!o) return e;
      const n = JSON.parse(o);
      if (Array.isArray(n))
        for (const s of n)
          Array.isArray(s) && s.length === 2 ? e.set(Number(s[0]), Number(s[1])) : typeof s == "number" && e.set(s, -1);
    } catch {
    }
    return e;
  }
  saveCuts() {
    if (!(!this.o.persist || typeof localStorage > "u"))
      try {
        localStorage.setItem(this.o.storageKey(this.seedRoute), JSON.stringify([...this.cutLinks]));
      } catch {
      }
  }
  build() {
    this.seedRoute = this.resolveSeed(this.o.seed);
    const t = b(this.seedRoute), e = C(t), o = this.o.maxTapes - this.o.minTapes + 1;
    this.count = this.o.minTapes + Math.floor(e() * o), this.w = this.root.clientWidth || this.container.clientWidth, this.h = this.root.clientHeight || this.container.clientHeight, this.cutLinks = this.loadCuts(this.seedRoute), this.raf && (cancelAnimationFrame(this.raf), this.raf = null), this.cordonSVG.querySelectorAll("g[data-tape]").forEach((s) => s.remove()), this.tapes = [];
    const n = this.o.nodes;
    for (let s = 0; s < this.count; s++) {
      const i = (s + 0.5) / this.count + (e() * 2 - 1) * 0.06, a = (e() * 2 - 1) * 16, c = 34 + e() * 20, r = this.makeTape(s, i, a, c), h = this.cutLinks.get(s);
      if (h !== void 0) {
        const d = h >= 0 ? h : 1 + b(`${this.seedRoute}:${s}`) % (n - 2), l = Math.max(1, Math.min(n - 2, d));
        r.cutLink = l, r.links[l] = !1, h !== l && this.cutLinks.set(s, l);
      }
      this.buildGroup(r), this.tapes.push(r);
    }
    for (let s = 0; s < 260; s++)
      for (const u of this.tapes) u.cutLink >= 0 && this.step(u);
    for (const s of this.tapes) this.draw(s);
    this.updateInteractivity(), !this.reduce && this.tapes.some((s) => s.cutLink >= 0) && this.kick();
  }
  makeTape(t, e, o, n) {
    const s = this.o.nodes, u = this.w / 2, i = Math.max(18, Math.min(this.h - 18, e * this.h)), a = Math.tan(o * Math.PI / 180), c = Math.max(28, n), r = -c, h = this.w + c, d = { x: r, y: i + a * (r - u) }, l = { x: h, y: i + a * (h - u) }, f = Math.max(1, Math.min(this.o.adhere, Math.floor(s / 2))), y = [];
    let g = 0;
    for (let m = 0; m < s; m++) {
      const v = m / (s - 1), S = d.x + (l.x - d.x) * v, k = d.y + (l.y - d.y) * v;
      y.push({ x: S, y: k, px: S, py: k, pin: m < f || m >= s - f }), m > 0 && (g += Math.hypot(y[m].x - y[m - 1].x, y[m].y - y[m - 1].y));
    }
    const M = new Array(s - 1).fill(!0), w = document.createElementNS(x, "g");
    w.setAttribute("data-tape", String(t));
    const L = b(`${this.seedRoute}:txt:${t}`) % this.o.message.length;
    return { index: t, nodes: y, links: M, rest: g / (s - 1), total: g, height: n, cutLink: -1, textShift: L, group: w, pieces: [] };
  }
  pieceRanges(t) {
    const e = this.o.nodes, o = [];
    let n = 0;
    for (let s = 0; s < e - 1; s++)
      t.links[s] || (o.push([n, s]), n = s + 1);
    return o.push([n, e - 1]), o;
  }
  buildGroup(t) {
    this.cordonSVG.appendChild(t.group), this.rebuildPieces(t);
  }
  rebuildPieces(t) {
    for (; t.group.firstChild; ) t.group.removeChild(t.group.firstChild);
    t.pieces = [];
    const e = t.height * 0.5, o = Math.max(8, Math.ceil(t.total / (this.o.message.length * t.height * 0.3))), n = this.o.message, s = (t.textShift % n.length + n.length) % n.length, u = (n.slice(s) + n.slice(0, s)).repeat(o);
    this.pieceRanges(t).forEach(([i, a], c) => {
      if (a <= i) {
        t.pieces.push(null);
        return;
      }
      const r = `slop-cl-${this.id}-${t.index}-${c}`, h = document.createElementNS(x, "path");
      h.setAttribute("fill", `url(#slop-haz-${this.id})`), h.setAttribute("stroke", this.o.colors.edge), h.setAttribute("stroke-width", "2"), h.setAttribute("stroke-linejoin", "round"), h.setAttribute("stroke-linecap", "round");
      const d = document.createElementNS(x, "path");
      d.setAttribute("id", r), d.setAttribute("fill", "none"), d.setAttribute("stroke", "none");
      const l = document.createElementNS(x, "text");
      l.setAttribute("font-size", String(e)), l.setAttribute("font-weight", "700"), l.setAttribute("dominant-baseline", "central"), l.setAttribute("fill", this.o.colors.text), l.style.fontFamily = this.o.fontFamily, l.style.letterSpacing = this.o.letterSpacing, l.style.userSelect = "none";
      const f = document.createElementNS(x, "textPath");
      f.setAttribute("href", `#${r}`), f.setAttributeNS(P, "href", `#${r}`), f.textContent = u, l.appendChild(f), t.group.append(h, d, l), t.pieces.push({ s: i, e: a, ribbon: h, centerline: d });
    });
  }
  // ---- physics -------------------------------------------------------------
  step(t) {
    const { gravity: e, damping: o, iterations: n } = this.o;
    for (const i of t.nodes) {
      if (i.pin) continue;
      const a = (i.x - i.px) * o, c = (i.y - i.py) * o;
      i.px = i.x, i.py = i.y, i.x += a, i.y += c + e * A * A;
    }
    const s = this.o.nodes;
    for (let i = 0; i < n; i++)
      for (let a = 0; a < s - 1; a++) {
        if (!t.links[a]) continue;
        const c = t.nodes[a], r = t.nodes[a + 1];
        let h = r.x - c.x, d = r.y - c.y;
        const l = Math.hypot(h, d) || 1e-3, f = (l - t.rest) / l * 0.5;
        h *= f, d *= f, c.pin || (c.x += h, c.y += d), r.pin || (r.x -= h, r.y -= d);
      }
    const u = t.height / 2;
    for (const i of t.nodes)
      i.pin || (i.x < u ? (i.x = u, i.px = i.x + (i.x - i.px) * 0.4) : i.x > this.w - u && (i.x = this.w - u, i.px = i.x + (i.x - i.px) * 0.4), i.y > this.h - u ? (i.y = this.h - u, i.px = i.x + (i.x - i.px) * 0.5, i.py = i.y) : i.y < u && (i.y = u));
  }
  draw(t) {
    for (const o of t.pieces) {
      if (!o) continue;
      const { fill: n, center: s } = N(t.nodes.slice(o.s, o.e + 1), t.height);
      o.ribbon.setAttribute("d", n), o.centerline.setAttribute("d", s);
    }
    let e = 0;
    for (const o of t.nodes) o.pin || (e += Math.abs(o.x - o.px) + Math.abs(o.y - o.py));
    return e;
  }
  kick() {
    this.idleFrames = 0, this.raf === null && !this.reduce && (this.raf = requestAnimationFrame(this.frame));
  }
  // ---- cutting -------------------------------------------------------------
  sever(t, e) {
    var s, u, i, a;
    if (t.cutLink !== -1) return !1;
    const o = this.o.nodes, n = Math.max(1, Math.min(o - 2, e));
    return t.cutLink = n, t.links[n] = !1, this.rebuildPieces(t), this.draw(t), this.cutLinks.set(t.index, n), this.saveCuts(), (u = (s = this.o).onCut) == null || u.call(s, { index: t.index, cutCount: this.cutLinks.size, total: this.count }), this.isCleared && (this.updateInteractivity(), (a = (i = this.o).onCleared) == null || a.call(i)), !0;
  }
  commitSlice() {
    const t = this.o.nodes, e = this.o.cutRadius;
    for (const o of this.tapes) {
      if (o.cutLink !== -1) continue;
      const n = this.stroke.filter((c) => {
        let r = 1 / 0;
        for (let h = 1; h < t - 1; h++) {
          const d = o.nodes[h], l = Math.hypot(d.x - c.x, d.y - c.y);
          l < r && (r = l);
        }
        return r < e;
      });
      if (!n.length) continue;
      const s = n.reduce((c, r) => c + r.x, 0) / n.length, u = n.reduce((c, r) => c + r.y, 0) / n.length;
      let i = 1, a = 1 / 0;
      for (let c = 1; c < t - 1; c++) {
        const r = o.nodes[c], h = Math.hypot(r.x - s, r.y - u);
        h < a && (a = h, i = c);
      }
      this.sever(o, i) && !this.reduce && this.kick();
    }
  }
  toLocal(t) {
    const e = this.root.getBoundingClientRect();
    return { x: t.clientX - e.left, y: t.clientY - e.top };
  }
  drawStroke() {
    this.slicePoly.setAttribute("points", this.stroke.map((t) => `${t.x},${t.y}`).join(" "));
  }
  updateInteractivity() {
    const t = this.isCleared, e = this.o.cuttable && !t;
    this.root.style.pointerEvents = e ? "auto" : "none", this.root.style.cursor = e ? "crosshair" : "", this.root.style.background = this.o.scrim && !t ? this.o.colors.scrim : "transparent", this.cordonSVG.style.opacity = t ? String(this.o.clearedOpacity) : "1";
  }
  onResize() {
    this.mounted && (this.resizeTimer && clearTimeout(this.resizeTimer), this.resizeTimer = setTimeout(() => this.build(), 150));
  }
}
export {
  E as TapeCordon,
  b as hashString,
  C as mulberry32,
  N as ribbonPaths
};
//# sourceMappingURL=index.js.map
