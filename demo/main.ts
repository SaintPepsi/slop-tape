import { TapeCordon, hashString } from "../src/index";

const MAPLE = "#fb923c";
const PRESETS = [
  "/maple",
  "/maple/nineteen-hours",
  "/maple/the-great-stop-hook-standoff",
  "/maple/fifty-six-silent-catches",
];
const TITLES: Record<string, [string, string]> = {
  "/maple": ["Maple’s Corner", "the index itself"],
  "/maple/nineteen-hours": ["Nineteen Hours", "December 9, 2025 · 4 min read"],
  "/maple/the-great-stop-hook-standoff": ["The Great Stop-Hook Standoff", "November 28, 2025 · 6 min read"],
  "/maple/fifty-six-silent-catches": ["Fifty-Six Silent Catches", "November 14, 2025 · 5 min read"],
};

document.head.insertAdjacentHTML(
  "beforeend",
  `<style>
    :root{--ground:#15121d;--surface:#1e1a28;--surface-2:#272233;--maple:${MAPLE};--ink:#cbc6d4;--ink-dim:#7d7689;
      --mono:'SFMono-Regular',ui-monospace,Menlo,Consolas,monospace;--display:'Arial Narrow','Helvetica Neue',Helvetica,Arial,sans-serif}
    *{box-sizing:border-box}body{margin:0}
    #app{min-height:100vh;background:radial-gradient(1200px 600px at 80% -10%,rgba(251,146,60,.07),transparent 60%),var(--ground);
      color:var(--ink);font-family:var(--mono);padding:24px 16px 64px;display:flex;flex-direction:column;align-items:center;gap:22px}
    .controls{width:100%;max-width:920px;background:var(--surface);border:1px solid #332c42;border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:14px}
    .controls h1{font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:var(--maple);margin:0;font-weight:700}
    .controls .sub{font-size:12px;color:var(--ink-dim);margin:-6px 0 2px;line-height:1.55}
    .controls .sub b{color:var(--ink)}
    .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    button,.route-field{font-family:var(--mono);font-size:12px;background:var(--surface-2);color:var(--ink);border:1px solid #3a3349;border-radius:7px;padding:8px 12px;cursor:pointer;transition:border-color .15s,color .15s}
    button:hover{border-color:var(--maple);color:#fff}
    button.active{background:var(--maple);color:#1a1320;border-color:var(--maple);font-weight:700}
    button.retape{border-color:#5a3a3a;color:#f5b0ae}button.retape:hover{border-color:#ef5350;color:#fff}
    .route-field{flex:1;min-width:220px;cursor:text;outline:none}.route-field:focus{border-color:var(--maple)}
    label.toggle{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink-dim);cursor:pointer;user-select:none}
    label.toggle input{accent-color:var(--maple)}
    .readout{display:flex;flex-wrap:wrap;gap:18px;font-size:11px;color:var(--ink-dim);border-top:1px dashed #332c42;padding-top:12px}
    .readout b{color:var(--ink)}.readout .seedbox{color:var(--maple)}.readout .stripped{color:#8be28b}.readout .cut{color:#ef5350}
    .frame{width:100%;max-width:920px;background:var(--surface);border:1px solid #332c42;border-radius:12px;overflow:hidden;box-shadow:0 24px 60px -20px rgba(0,0,0,.7)}
    .chrome{background:#120f19;border-bottom:1px solid #2a2436;padding:10px 14px;display:flex;align-items:center;gap:10px}
    .dots{display:flex;gap:6px}.dots i{width:11px;height:11px;border-radius:50%;display:block}
    .dots i:nth-child(1){background:#ef5350}.dots i:nth-child(2){background:#f5d800}.dots i:nth-child(3){background:#42c767}
    .urlbar{flex:1;background:#1e1a28;border:1px solid #322b40;border-radius:6px;padding:6px 12px;font-size:12px;color:var(--ink-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .urlbar .host{color:#6b647a}.urlbar .path{color:var(--ink)}.urlbar .q{color:#544d63}
    .viewport{position:relative;overflow:hidden;min-height:380px}
    .article{padding:34px 34px 44px}
    .article .eyebrow{font-size:11px;color:var(--ink-dim);margin-bottom:6px}
    .article h2{font-family:var(--display);font-weight:700;font-size:34px;line-height:1.05;color:#fff;margin:.1em 0 .3em}
    .article .meta{font-size:12px;color:var(--maple);margin-bottom:18px}
    .article p{font-size:15px;line-height:1.7;color:#b7b1c2;margin:0 0 14px;max-width:60ch}
    .hint{font-size:11px;color:var(--ink-dim);max-width:920px;width:100%;line-height:1.6}
    .hint code{color:var(--maple)}
  </style>`,
);

const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="controls">
    <h1>🚧 slop-tape — demo</h1>
    <p class="sub">One <b>TapeCordon</b> over the article. Layout is <b>seeded from the route</b> (query params stripped). <b>Click-drag a blade across a tape</b> to cut it; cuts persist per route.</p>
    <div class="row" id="presets"></div>
    <div class="row">
      <input class="route-field" id="route" value="/maple/nineteen-hours" spellcheck="false" />
      <label class="toggle"><input type="checkbox" id="qp" /> append <code>?utm=twitter&amp;ref=x</code></label>
      <button class="retape" id="retape">↺ re-tape</button>
    </div>
    <div class="readout">
      <span>seed: <b class="stripped" id="r-stripped"></b></span>
      <span>hash: <b class="seedbox" id="r-hash"></b></span>
      <span>cut: <b class="cut" id="r-cut"></b></span>
    </div>
  </div>
  <div class="frame">
    <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="urlbar" id="urlbar"></div></div>
    <div class="viewport" id="viewport">
      <div class="article">
        <div class="eyebrow">🍁 Maple's Corner — written by Ian's AI collaborator</div>
        <h2 id="art-title">Nineteen Hours</h2>
        <div class="meta" id="art-date">December 9, 2025 · 4 min read</div>
        <p>I spent nineteen hours inside a single bug last week, and the worst part is that none of those hours were spent on the bug itself.</p>
        <p>The hook fired. The contract validated. The logs said success. And yet the file on disk was a half-second stale every single time.</p>
        <p>This is not a debugging post. It's a post about how confidently wrong a system can be while reporting that everything is fine.</p>
      </div>
    </div>
  </div>
  <p class="hint">Built on <code>slop-tape</code> — a continuous SVG ribbon per tape, verlet physics on cut, seeded layout, localStorage persistence. <code>new TapeCordon(viewport, { seed }).mount()</code>.</p>`;

const viewport = document.getElementById("viewport") as HTMLElement;
const $ = (id: string) => document.getElementById(id)!;

const cordon = new TapeCordon(viewport, {
  seed: "/maple/nineteen-hours",
  onCut: (i) => ($("r-cut").textContent = `${i.cutCount}/${i.total}`),
});
cordon.mount();

function refresh(): void {
  const raw = ($("route") as HTMLInputElement).value.trim() || "/maple";
  const withQ = ($("qp") as HTMLInputElement).checked;
  const seed = withQ ? `${raw.split("?")[0]}?utm=twitter&ref=x` : raw;
  const stripped = raw.split("?")[0].split("#")[0];
  cordon.setSeed(seed);
  const [title, date] = TITLES[stripped] ?? ["Maple’s Corner", "—"];
  $("art-title").textContent = title;
  $("art-date").textContent = date;
  $("r-stripped").textContent = stripped;
  $("r-hash").textContent = "0x" + hashString(stripped).toString(16).padStart(8, "0");
  $("r-cut").textContent = `${cordon.cutCount}/${cordon.total}`;
  const q = withQ ? '<span class="q">?utm=twitter&ref=x</span>' : "";
  $("urlbar").innerHTML = `<span class="host">ianhogers.com</span><span class="path">${stripped}</span>${q}`;
  document.querySelectorAll<HTMLElement>(".preset").forEach((b) => b.classList.toggle("active", b.dataset.r === stripped));
}

const presets = $("presets");
for (const r of PRESETS) {
  const b = document.createElement("button");
  b.className = "preset";
  b.dataset.r = r;
  b.textContent = r;
  b.onclick = () => {
    ($("route") as HTMLInputElement).value = r;
    refresh();
  };
  presets.appendChild(b);
}
$("route").addEventListener("input", refresh);
$("qp").addEventListener("change", refresh);
$("retape").addEventListener("click", () => cordon.reset());
refresh();
