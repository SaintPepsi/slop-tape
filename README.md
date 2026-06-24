# slop-tape

Physics **"AI SLOP POLICE"** crime-scene tape you can sling across any element and
**cut through**. Zero runtime dependencies, framework-agnostic — drop it into a
SvelteKit site, a plain HTML page, or a game canvas overlay.

- **Seeded layout** — the tape arrangement is hashed from a string (e.g. a page URL),
  so it's identical every visit and different per page.
- **Continuous SVG ribbons** — each tape is one flowing path with the warning text
  riding a `<textPath>`, not faceted blocks.
- **Verlet physics on cut** — uncut tape is tightly wrapped and static; slice a tape and
  the freed ends fall, swing, and pool under gravity, staying in view.
- **Drag-to-cut** — the blade line follows your stroke and severs on release at the
  average crossing point.
- **Persistent** — cuts are remembered per seed in `localStorage`.
- **Respectful** — honours `prefers-reduced-motion` (instant gap, no physics).

> This is the rendering engine behind a bigger idea — a community extension that lets
> people tape any site as AI slop. See [`IDEA.md`](./IDEA.md).

## Install

GitHub-only for now:

```sh
bun add github:SaintPepsi/slop-tape
# or: npm install github:SaintPepsi/slop-tape
```

## Usage

```ts
import { TapeCordon } from "slop-tape";

const container = document.querySelector("#article")!; // any positioned element
const cordon = new TapeCordon(container, {
  seed: location.pathname,        // stable per page, query params stripped
  message: "AI SLOP POLICE · INVESTIGATION IN PROGRESS · DO NOT ENTER · ",
  onCleared: () => console.log("they cut through"),
});
cordon.mount();
```

The cordon overlays its container (which is made `position: relative` if it was
`static`). Call `cordon.destroy()` to remove it.

### SvelteKit

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { TapeCordon } from "slop-tape";

  let host: HTMLElement;
  onMount(() => {
    const cordon = new TapeCordon(host, { seed: page.url.pathname }).mount();
    return () => cordon.destroy();
  });
</script>

<div bind:this={host} class="relative">
  <!-- page content -->
</div>
```

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `seed` | `""` | Deterministic layout key (usually the page path). |
| `stripQuery` | `true` | Drop `?query`/`#hash` from the seed before hashing. |
| `message` | `"AI SLOP POLICE · … · "` | Repeated text that flows along each tape. |
| `minTapes` / `maxTapes` | `5` / `8` | Inclusive seeded tape-count range. |
| `nodes` | `20` | Verlet nodes per tape (ribbon resolution). |
| `adhere` | `3` | Nodes glued flat at each end so cut tape stays flush/attached, not hinged at the corner. |
| `gravity` / `damping` / `iterations` | `2600` / `0.9` / `12` | Physics tuning. |
| `cuttable` | `true` | Enable drag-to-cut. |
| `cutRadius` | `34` | Hit radius (px) for the slice stroke. |
| `persist` | `true` | Remember cuts in `localStorage`. |
| `storageKey` | `seed => "slop-tape:"+seed` | Override the storage key. |
| `scrim` | `true` | Dim the content behind the cordon. |
| `zIndex` | `40` | Overlay stacking. |
| `reducedMotion` | `"auto"` | `"auto"` reads the media query; or force boolean. |
| `colors` | hazard yellow/black | `{ tape, tapeHighlight, tapeShadow, edge, text, scrim, slice, sliceGlow }`. |
| `onCut` / `onCleared` | — | Callbacks. |

## API

```ts
cordon.mount();          // build + start (no-op on server)
cordon.setSeed(path);    // re-lay for a new page (SPA navigation)
cordon.reset();          // clear persisted cuts, re-tape
cordon.cutAll();         // programmatically cut everything
cordon.destroy();        // remove the overlay
cordon.cutCount;         // number of tapes cut
cordon.isCleared;        // every tape cut?
```

Also exported: `hashString`, `mulberry32`, `ribbonPaths` for building your own variants.

## Develop

```sh
bun install
bun run dev     # demo / playground at localhost:5173
bun run build   # emits dist/ (ESM + types)
bun run check   # typecheck
```

## License

MIT © Ian Hogers
