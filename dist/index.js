function k(f) {
  let t = 2166136261;
  for (let e = 0; e < f.length; e++)
    t ^= f.charCodeAt(e), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function C(f) {
  let t = f >>> 0;
  return () => {
    t = t + 1831565813 | 0;
    let e = Math.imul(t ^ t >>> 15, 1 | t);
    return e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, ((e ^ e >>> 14) >>> 0) / 4294967296;
  };
}
function P(f, t) {
  const e = t / 2, o = f.length, r = [], s = [], l = [];
  for (let i = 0; i < o; i++) {
    const a = f[i], n = f[Math.max(0, i - 1)], h = f[Math.min(o - 1, i + 1)];
    let c = h.x - n.x, u = h.y - n.y;
    const d = Math.hypot(c, u) || 1;
    c /= d, u /= d;
    const y = -u, m = c;
    r.push(`${(a.x + y * e).toFixed(1)} ${(a.y + m * e).toFixed(1)}`), s.push(`${(a.x - y * e).toFixed(1)} ${(a.y - m * e).toFixed(1)}`), l.push(`${a.x.toFixed(1)} ${a.y.toFixed(1)}`);
  }
  return s.reverse(), {
    fill: `M${r.join(" L")} L${s.join(" L")} Z`,
    center: `M${l.join(" L")}`
  };
}
const x = "http://www.w3.org/2000/svg", T = "http://www.w3.org/1999/xlink", A = 1 / 60, L = {
  tape: "#f5d800",
  tapeHighlight: "#ffe000",
  tapeShadow: "#d9c000",
  edge: "#0a0a0a",
  text: "#0a0a0a",
  scrim: "rgba(8,6,12,0.55)",
  slice: "#ffffff",
  sliceGlow: "rgba(239,83,80,0.95)"
};
let N = 0;
class $ {
  constructor(t, e = {}) {
    this.id = ++N, this.tapes = [], this.cuts = /* @__PURE__ */ new Set(), this.count = 0, this.seedRoute = "", this.w = 0, this.h = 0, this.raf = null, this.idleFrames = 0, this.slicing = !1, this.stroke = [], this.reduce = !1, this.mounted = !1, this.resizeTimer = null, this.frame = () => {
      let o = 0;
      for (const r of this.tapes)
        r.cutLink < 0 || (this.step(r), o += this.draw(r));
      if (o < 0.4 ? this.idleFrames++ : this.idleFrames = 0, this.idleFrames > 20) {
        this.raf = null;
        return;
      }
      this.raf = requestAnimationFrame(this.frame);
    }, this.onPointerDown = (o) => {
      var r, s;
      this.isCleared || (this.slicing = !0, (s = (r = this.root).setPointerCapture) == null || s.call(r, o.pointerId), this.stroke = [this.toLocal(o)], this.drawStroke());
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
      reducedMotion: e.reducedMotion ?? "auto",
      fontFamily: e.fontFamily ?? '"Arial Narrow","Helvetica Neue",Helvetica,Arial,sans-serif',
      letterSpacing: e.letterSpacing ?? "0.14em",
      colors: { ...L, ...e.colors ?? {} },
      onCut: e.onCut,
      onCleared: e.onCleared
    };
  }
  // ---- public API ----------------------------------------------------------
  /** Number of tapes cut on the current page. */
  get cutCount() {
    return this.cuts.size;
  }
  /** Total tapes the current seed produced. */
  get total() {
    return this.count;
  }
  /** True once every tape on the page has been cut. */
  get isCleared() {
    return this.count > 0 && this.cuts.size >= this.count;
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
    return this.cuts.clear(), this.mounted && this.build(), this;
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
    if (!this.o.persist || typeof localStorage > "u") return /* @__PURE__ */ new Set();
    try {
      const e = localStorage.getItem(this.o.storageKey(t));
      return new Set(e ? JSON.parse(e) : []);
    } catch {
      return /* @__PURE__ */ new Set();
    }
  }
  saveCuts() {
    if (!(!this.o.persist || typeof localStorage > "u"))
      try {
        localStorage.setItem(this.o.storageKey(this.seedRoute), JSON.stringify([...this.cuts]));
      } catch {
      }
  }
  build() {
    this.seedRoute = this.resolveSeed(this.o.seed);
    const t = k(this.seedRoute), e = C(t), o = this.o.maxTapes - this.o.minTapes + 1;
    this.count = this.o.minTapes + Math.floor(e() * o), this.w = this.root.clientWidth || this.container.clientWidth, this.h = this.root.clientHeight || this.container.clientHeight, this.cuts = this.loadCuts(this.seedRoute), this.raf && (cancelAnimationFrame(this.raf), this.raf = null), this.cordonSVG.querySelectorAll("g[data-tape]").forEach((s) => s.remove()), this.tapes = [];
    const r = this.o.nodes;
    for (let s = 0; s < this.count; s++) {
      const i = (s + 0.5) / this.count + (e() * 2 - 1) * 0.06, a = (e() * 2 - 1) * 16, n = 34 + e() * 20, h = this.makeTape(s, i, a, n);
      if (this.cuts.has(s)) {
        const c = 1 + k(`${this.seedRoute}:${s}`) % (r - 2);
        h.cutLink = c, h.links[c] = !1;
      }
      this.buildGroup(h), this.tapes.push(h);
    }
    for (let s = 0; s < 260; s++)
      for (const l of this.tapes) l.cutLink >= 0 && this.step(l);
    for (const s of this.tapes) this.draw(s);
    this.updateInteractivity(), !this.reduce && this.tapes.some((s) => s.cutLink >= 0) && this.kick();
  }
  makeTape(t, e, o, r) {
    const s = this.o.nodes, l = this.w / 2, i = Math.max(18, Math.min(this.h - 18, e * this.h)), a = Math.tan(o * Math.PI / 180), n = Math.max(28, r), h = -n, c = this.w + n, u = { x: h, y: i + a * (h - l) }, d = { x: c, y: i + a * (c - l) }, y = Math.max(1, Math.min(this.o.adhere, Math.floor(s / 2))), m = [];
    let g = 0;
    for (let p = 0; p < s; p++) {
      const w = p / (s - 1), v = u.x + (d.x - u.x) * w, S = u.y + (d.y - u.y) * w;
      m.push({ x: v, y: S, px: v, py: S, pin: p < y || p >= s - y }), p > 0 && (g += Math.hypot(m[p].x - m[p - 1].x, m[p].y - m[p - 1].y));
    }
    const M = new Array(s - 1).fill(!0), b = document.createElementNS(x, "g");
    return b.setAttribute("data-tape", String(t)), { index: t, nodes: m, links: M, rest: g / (s - 1), total: g, height: r, cutLink: -1, group: b, pieces: [] };
  }
  pieceRanges(t) {
    const e = this.o.nodes, o = [];
    let r = 0;
    for (let s = 0; s < e - 1; s++)
      t.links[s] || (o.push([r, s]), r = s + 1);
    return o.push([r, e - 1]), o;
  }
  buildGroup(t) {
    this.cordonSVG.appendChild(t.group), this.rebuildPieces(t);
  }
  rebuildPieces(t) {
    for (; t.group.firstChild; ) t.group.removeChild(t.group.firstChild);
    t.pieces = [];
    const e = t.height * 0.5, o = Math.max(8, Math.ceil(t.total / (this.o.message.length * t.height * 0.3))), r = this.o.message.repeat(o);
    this.pieceRanges(t).forEach(([s, l], i) => {
      if (l <= s) {
        t.pieces.push(null);
        return;
      }
      const a = `slop-cl-${this.id}-${t.index}-${i}`, n = document.createElementNS(x, "path");
      n.setAttribute("fill", `url(#slop-haz-${this.id})`), n.setAttribute("stroke", this.o.colors.edge), n.setAttribute("stroke-width", "2"), n.setAttribute("stroke-linejoin", "round"), n.setAttribute("stroke-linecap", "round");
      const h = document.createElementNS(x, "path");
      h.setAttribute("id", a), h.setAttribute("fill", "none"), h.setAttribute("stroke", "none");
      const c = document.createElementNS(x, "text");
      c.setAttribute("font-size", String(e)), c.setAttribute("font-weight", "700"), c.setAttribute("dominant-baseline", "central"), c.setAttribute("fill", this.o.colors.text), c.style.fontFamily = this.o.fontFamily, c.style.letterSpacing = this.o.letterSpacing, c.style.userSelect = "none";
      const u = document.createElementNS(x, "textPath");
      u.setAttribute("href", `#${a}`), u.setAttributeNS(T, "href", `#${a}`), u.textContent = r, c.appendChild(u), t.group.append(n, h, c), t.pieces.push({ s, e: l, ribbon: n, centerline: h });
    });
  }
  // ---- physics -------------------------------------------------------------
  step(t) {
    const { gravity: e, damping: o, iterations: r } = this.o;
    for (const i of t.nodes) {
      if (i.pin) continue;
      const a = (i.x - i.px) * o, n = (i.y - i.py) * o;
      i.px = i.x, i.py = i.y, i.x += a, i.y += n + e * A * A;
    }
    const s = this.o.nodes;
    for (let i = 0; i < r; i++)
      for (let a = 0; a < s - 1; a++) {
        if (!t.links[a]) continue;
        const n = t.nodes[a], h = t.nodes[a + 1];
        let c = h.x - n.x, u = h.y - n.y;
        const d = Math.hypot(c, u) || 1e-3, y = (d - t.rest) / d * 0.5;
        c *= y, u *= y, n.pin || (n.x += c, n.y += u), h.pin || (h.x -= c, h.y -= u);
      }
    const l = t.height / 2;
    for (const i of t.nodes)
      i.pin || (i.x < l ? (i.x = l, i.px = i.x + (i.x - i.px) * 0.4) : i.x > this.w - l && (i.x = this.w - l, i.px = i.x + (i.x - i.px) * 0.4), i.y > this.h - l ? (i.y = this.h - l, i.px = i.x + (i.x - i.px) * 0.5, i.py = i.y) : i.y < l && (i.y = l));
  }
  draw(t) {
    for (const o of t.pieces) {
      if (!o) continue;
      const { fill: r, center: s } = P(t.nodes.slice(o.s, o.e + 1), t.height);
      o.ribbon.setAttribute("d", r), o.centerline.setAttribute("d", s);
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
    var s, l, i, a;
    if (t.cutLink !== -1) return !1;
    const o = this.o.nodes, r = Math.max(1, Math.min(o - 2, e));
    return t.cutLink = r, t.links[r] = !1, this.rebuildPieces(t), this.draw(t), this.cuts.add(t.index), this.saveCuts(), (l = (s = this.o).onCut) == null || l.call(s, { index: t.index, cutCount: this.cuts.size, total: this.count }), this.isCleared && (this.updateInteractivity(), (a = (i = this.o).onCleared) == null || a.call(i)), !0;
  }
  commitSlice() {
    const t = this.o.nodes, e = this.o.cutRadius;
    for (const o of this.tapes) {
      if (o.cutLink !== -1) continue;
      const r = this.stroke.filter((n) => {
        let h = 1 / 0;
        for (let c = 1; c < t - 1; c++) {
          const u = o.nodes[c], d = Math.hypot(u.x - n.x, u.y - n.y);
          d < h && (h = d);
        }
        return h < e;
      });
      if (!r.length) continue;
      const s = r.reduce((n, h) => n + h.x, 0) / r.length, l = r.reduce((n, h) => n + h.y, 0) / r.length;
      let i = 1, a = 1 / 0;
      for (let n = 1; n < t - 1; n++) {
        const h = o.nodes[n], c = Math.hypot(h.x - s, h.y - l);
        c < a && (a = c, i = n);
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
    this.root.style.pointerEvents = e ? "auto" : "none", this.root.style.cursor = e ? "crosshair" : "", this.root.style.background = this.o.scrim && !t ? this.o.colors.scrim : "transparent";
  }
  onResize() {
    this.mounted && (this.resizeTimer && clearTimeout(this.resizeTimer), this.resizeTimer = setTimeout(() => this.build(), 150));
  }
}
export {
  $ as TapeCordon,
  k as hashString,
  C as mulberry32,
  P as ribbonPaths
};
//# sourceMappingURL=index.js.map
