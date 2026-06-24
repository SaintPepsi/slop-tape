function v(f) {
  let t = 2166136261;
  for (let e = 0; e < f.length; e++)
    t ^= f.charCodeAt(e), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function A(f) {
  let t = f >>> 0;
  return () => {
    t = t + 1831565813 | 0;
    let e = Math.imul(t ^ t >>> 15, 1 | t);
    return e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, ((e ^ e >>> 14) >>> 0) / 4294967296;
  };
}
function M(f, t) {
  const e = t / 2, o = f.length, c = [], s = [], l = [];
  for (let i = 0; i < o; i++) {
    const a = f[i], n = f[Math.max(0, i - 1)], r = f[Math.min(o - 1, i + 1)];
    let h = r.x - n.x, u = r.y - n.y;
    const d = Math.hypot(h, u) || 1;
    h /= d, u /= d;
    const m = -u, x = h;
    c.push(`${(a.x + m * e).toFixed(1)} ${(a.y + x * e).toFixed(1)}`), s.push(`${(a.x - m * e).toFixed(1)} ${(a.y - x * e).toFixed(1)}`), l.push(`${a.x.toFixed(1)} ${a.y.toFixed(1)}`);
  }
  return s.reverse(), {
    fill: `M${c.join(" L")} L${s.join(" L")} Z`,
    center: `M${l.join(" L")}`
  };
}
const y = "http://www.w3.org/2000/svg", C = "http://www.w3.org/1999/xlink", k = 1 / 60, P = {
  tape: "#f5d800",
  tapeHighlight: "#ffe000",
  tapeShadow: "#d9c000",
  edge: "#0a0a0a",
  text: "#0a0a0a",
  scrim: "rgba(8,6,12,0.55)",
  slice: "#ffffff",
  sliceGlow: "rgba(239,83,80,0.95)"
};
let T = 0;
class L {
  constructor(t, e = {}) {
    this.id = ++T, this.tapes = [], this.cuts = /* @__PURE__ */ new Set(), this.count = 0, this.seedRoute = "", this.w = 0, this.h = 0, this.raf = null, this.idleFrames = 0, this.slicing = !1, this.stroke = [], this.reduce = !1, this.mounted = !1, this.resizeTimer = null, this.frame = () => {
      let o = 0;
      for (const c of this.tapes)
        c.cutLink < 0 || (this.step(c), o += this.draw(c));
      if (o < 0.4 ? this.idleFrames++ : this.idleFrames = 0, this.idleFrames > 20) {
        this.raf = null;
        return;
      }
      this.raf = requestAnimationFrame(this.frame);
    }, this.onPointerDown = (o) => {
      var c, s;
      this.isCleared || (this.slicing = !0, (s = (c = this.root).setPointerCapture) == null || s.call(c, o.pointerId), this.stroke = [this.toLocal(o)], this.drawStroke());
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
      colors: { ...P, ...e.colors ?? {} },
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
    return t.className = "slop-tape-root", t.style.cssText = `position:absolute;inset:0;width:100%;height:100%;overflow:hidden;z-index:${this.o.zIndex};`, this.root = t, this.cordonSVG = document.createElementNS(y, "svg"), this.cordonSVG.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;", this.cordonSVG.innerHTML = `<defs><linearGradient id="slop-haz-${this.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${this.o.colors.tape}"/><stop offset="0.5" stop-color="${this.o.colors.tapeHighlight}"/><stop offset="1" stop-color="${this.o.colors.tapeShadow}"/></linearGradient></defs>`, this.sliceSVG = document.createElementNS(y, "svg"), this.sliceSVG.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:2;", this.slicePoly = document.createElementNS(y, "polyline"), this.slicePoly.setAttribute("fill", "none"), this.slicePoly.setAttribute("stroke", this.o.colors.slice), this.slicePoly.setAttribute("stroke-width", "2.5"), this.slicePoly.setAttribute("stroke-linecap", "round"), this.slicePoly.setAttribute("stroke-linejoin", "round"), this.slicePoly.style.filter = `drop-shadow(0 0 5px ${this.o.colors.sliceGlow})`, this.sliceSVG.appendChild(this.slicePoly), t.append(this.cordonSVG, this.sliceSVG), this.container.appendChild(t), this.o.cuttable && (t.addEventListener("pointerdown", this.onPointerDown), window.addEventListener("pointermove", this.onPointerMove), window.addEventListener("pointerup", this.onPointerUp)), this.resizeObserver = new ResizeObserver(() => this.onResize()), this.resizeObserver.observe(this.container), this.mounted = !0, this.build(), this;
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
    const t = v(this.seedRoute), e = A(t), o = this.o.maxTapes - this.o.minTapes + 1;
    this.count = this.o.minTapes + Math.floor(e() * o), this.w = this.root.clientWidth || this.container.clientWidth, this.h = this.root.clientHeight || this.container.clientHeight, this.cuts = this.loadCuts(this.seedRoute), this.raf && (cancelAnimationFrame(this.raf), this.raf = null), this.cordonSVG.querySelectorAll("g[data-tape]").forEach((s) => s.remove()), this.tapes = [];
    const c = this.o.nodes;
    for (let s = 0; s < this.count; s++) {
      const i = (s + 0.5) / this.count + (e() * 2 - 1) * 0.06, a = (e() * 2 - 1) * 16, n = 34 + e() * 20, r = this.makeTape(s, i, a, n);
      if (this.cuts.has(s)) {
        const h = 1 + v(`${this.seedRoute}:${s}`) % (c - 2);
        r.cutLink = h, r.links[h] = !1;
      }
      this.buildGroup(r), this.tapes.push(r);
    }
    for (let s = 0; s < 260; s++)
      for (const l of this.tapes) l.cutLink >= 0 && this.step(l);
    for (const s of this.tapes) this.draw(s);
    this.updateInteractivity(), !this.reduce && this.tapes.some((s) => s.cutLink >= 0) && this.kick();
  }
  makeTape(t, e, o, c) {
    const s = this.o.nodes, l = this.w / 2, i = Math.max(18, Math.min(this.h - 18, e * this.h)), a = Math.tan(o * Math.PI / 180), n = 4, r = this.w - 4, h = { x: n, y: i + a * (n - l) }, u = { x: r, y: i + a * (r - l) }, d = [];
    let m = 0;
    for (let p = 0; p < s; p++) {
      const b = p / (s - 1), w = h.x + (u.x - h.x) * b, S = h.y + (u.y - h.y) * b;
      d.push({ x: w, y: S, px: w, py: S, pin: p === 0 || p === s - 1 }), p > 0 && (m += Math.hypot(d[p].x - d[p - 1].x, d[p].y - d[p - 1].y));
    }
    const x = new Array(s - 1).fill(!0), g = document.createElementNS(y, "g");
    return g.setAttribute("data-tape", String(t)), { index: t, nodes: d, links: x, rest: m / (s - 1), total: m, height: c, cutLink: -1, group: g, pieces: [] };
  }
  pieceRanges(t) {
    const e = this.o.nodes, o = [];
    let c = 0;
    for (let s = 0; s < e - 1; s++)
      t.links[s] || (o.push([c, s]), c = s + 1);
    return o.push([c, e - 1]), o;
  }
  buildGroup(t) {
    this.cordonSVG.appendChild(t.group), this.rebuildPieces(t);
  }
  rebuildPieces(t) {
    for (; t.group.firstChild; ) t.group.removeChild(t.group.firstChild);
    t.pieces = [];
    const e = t.height * 0.5, o = Math.max(8, Math.ceil(t.total / (this.o.message.length * t.height * 0.3))), c = this.o.message.repeat(o);
    this.pieceRanges(t).forEach(([s, l], i) => {
      if (l <= s) {
        t.pieces.push(null);
        return;
      }
      const a = `slop-cl-${this.id}-${t.index}-${i}`, n = document.createElementNS(y, "path");
      n.setAttribute("fill", `url(#slop-haz-${this.id})`), n.setAttribute("stroke", this.o.colors.edge), n.setAttribute("stroke-width", "2"), n.setAttribute("stroke-linejoin", "round"), n.setAttribute("stroke-linecap", "round");
      const r = document.createElementNS(y, "path");
      r.setAttribute("id", a), r.setAttribute("fill", "none"), r.setAttribute("stroke", "none");
      const h = document.createElementNS(y, "text");
      h.setAttribute("font-size", String(e)), h.setAttribute("font-weight", "700"), h.setAttribute("dominant-baseline", "central"), h.setAttribute("fill", this.o.colors.text), h.style.fontFamily = this.o.fontFamily, h.style.letterSpacing = this.o.letterSpacing, h.style.userSelect = "none";
      const u = document.createElementNS(y, "textPath");
      u.setAttribute("href", `#${a}`), u.setAttributeNS(C, "href", `#${a}`), u.textContent = c, h.appendChild(u), t.group.append(n, r, h), t.pieces.push({ s, e: l, ribbon: n, centerline: r });
    });
  }
  // ---- physics -------------------------------------------------------------
  step(t) {
    const { gravity: e, damping: o, iterations: c } = this.o;
    for (const i of t.nodes) {
      if (i.pin) continue;
      const a = (i.x - i.px) * o, n = (i.y - i.py) * o;
      i.px = i.x, i.py = i.y, i.x += a, i.y += n + e * k * k;
    }
    const s = this.o.nodes;
    for (let i = 0; i < c; i++)
      for (let a = 0; a < s - 1; a++) {
        if (!t.links[a]) continue;
        const n = t.nodes[a], r = t.nodes[a + 1];
        let h = r.x - n.x, u = r.y - n.y;
        const d = Math.hypot(h, u) || 1e-3, m = (d - t.rest) / d * 0.5;
        h *= m, u *= m, n.pin || (n.x += h, n.y += u), r.pin || (r.x -= h, r.y -= u);
      }
    const l = t.height / 2;
    for (const i of t.nodes)
      i.pin || (i.x < l ? (i.x = l, i.px = i.x + (i.x - i.px) * 0.4) : i.x > this.w - l && (i.x = this.w - l, i.px = i.x + (i.x - i.px) * 0.4), i.y > this.h - l ? (i.y = this.h - l, i.px = i.x + (i.x - i.px) * 0.5, i.py = i.y) : i.y < l && (i.y = l));
  }
  draw(t) {
    for (const o of t.pieces) {
      if (!o) continue;
      const { fill: c, center: s } = M(t.nodes.slice(o.s, o.e + 1), t.height);
      o.ribbon.setAttribute("d", c), o.centerline.setAttribute("d", s);
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
    const o = this.o.nodes, c = Math.max(1, Math.min(o - 2, e));
    return t.cutLink = c, t.links[c] = !1, this.rebuildPieces(t), this.draw(t), this.cuts.add(t.index), this.saveCuts(), (l = (s = this.o).onCut) == null || l.call(s, { index: t.index, cutCount: this.cuts.size, total: this.count }), this.isCleared && (this.updateInteractivity(), (a = (i = this.o).onCleared) == null || a.call(i)), !0;
  }
  commitSlice() {
    const t = this.o.nodes, e = this.o.cutRadius;
    for (const o of this.tapes) {
      if (o.cutLink !== -1) continue;
      const c = this.stroke.filter((n) => {
        let r = 1 / 0;
        for (let h = 1; h < t - 1; h++) {
          const u = o.nodes[h], d = Math.hypot(u.x - n.x, u.y - n.y);
          d < r && (r = d);
        }
        return r < e;
      });
      if (!c.length) continue;
      const s = c.reduce((n, r) => n + r.x, 0) / c.length, l = c.reduce((n, r) => n + r.y, 0) / c.length;
      let i = 1, a = 1 / 0;
      for (let n = 1; n < t - 1; n++) {
        const r = o.nodes[n], h = Math.hypot(r.x - s, r.y - l);
        h < a && (a = h, i = n);
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
  L as TapeCordon,
  v as hashString,
  A as mulberry32,
  M as ribbonPaths
};
//# sourceMappingURL=index.js.map
