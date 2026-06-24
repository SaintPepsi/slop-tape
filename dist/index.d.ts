/**
 * Deterministic seeding: a string seed (e.g. a page URL) always produces the
 * same tape layout. FNV-1a hash → mulberry32 PRNG.
 */
/** FNV-1a 32-bit hash of a string. */
export declare function hashString(str: string): number;

/** mulberry32 PRNG — small, fast, deterministic. Returns a () => [0,1) generator. */
export declare function mulberry32(seed: number): () => number;

/** Ribbon geometry: turn a centerline of nodes into a continuous filled band. */
declare interface Point {
    x: number;
    y: number;
}

/**
 * Build a continuous ribbon from a list of centerline nodes by offsetting each
 * node ±height/2 along its local normal. Returns the SVG path `d` for the filled
 * band and the matching centerline `d` (used as a `<textPath>` track so the
 * warning text flows along the bend).
 */
export declare function ribbonPaths(nodes: readonly Point[], height: number): {
    fill: string;
    center: string;
};

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
export declare class TapeCordon {
    private readonly container;
    private readonly o;
    private readonly id;
    private root;
    private cordonSVG;
    private sliceSVG;
    private slicePoly;
    private tapes;
    private cutLinks;
    private count;
    private seedRoute;
    private w;
    private h;
    private raf;
    private idleFrames;
    private slicing;
    private stroke;
    private reduce;
    private mounted;
    private resizeObserver?;
    private resizeTimer;
    constructor(container: HTMLElement, options?: TapeCordonOptions);
    /** Number of tapes cut on the current page. */
    get cutCount(): number;
    /** Total tapes the current seed produced. */
    get total(): number;
    /** True once every tape on the page has been cut. */
    get isCleared(): boolean;
    /** Build the overlay and start. No-op on the server or if already mounted. */
    mount(): this;
    /** Change the seed (e.g. on SPA navigation) and re-lay the cordon. */
    setSeed(seed: string): this;
    /** Clear persisted cuts for the current seed and re-tape. */
    reset(): this;
    /** Programmatically cut every remaining tape. */
    cutAll(): this;
    /** Tear everything down and remove the overlay. */
    destroy(): void;
    private resolveSeed;
    private loadCuts;
    private saveCuts;
    private build;
    private makeTape;
    private pieceRanges;
    private buildGroup;
    private rebuildPieces;
    private step;
    private draw;
    private frame;
    private kick;
    private sever;
    private commitSlice;
    private toLocal;
    private drawStroke;
    private onPointerDown;
    private onPointerMove;
    private onPointerUp;
    private updateInteractivity;
    private onResize;
}

export declare interface TapeCordonColors {
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

export declare interface TapeCordonOptions {
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
    /** Opacity of the (cut) ribbons once every tape on the page is cut. Default 0.7. */
    clearedOpacity?: number;
    /**
     * Clip the top/bottom of the overlay. Sides are always clipped (so tape wraps over
     * the edges); this only controls vertical. `true` (default) clips all sides — right
     * for small/nicher targets. `false` lets the top/bottom tapes show fully — right for
     * tall content like an article column.
     */
    clipVertical?: boolean;
    /** Honour prefers-reduced-motion (no physics, instant gap). `"auto"` | boolean. Default "auto". */
    reducedMotion?: boolean | "auto";
    /** Font for the warning text. */
    fontFamily?: string;
    letterSpacing?: string;
    colors?: Partial<TapeCordonColors>;
    /** Fired after each successful cut. */
    onCut?: (info: {
        index: number;
        cutCount: number;
        total: number;
    }) => void;
    /** Fired once every tape on the page has been cut. */
    onCleared?: () => void;
}

export { }
