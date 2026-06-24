/** Ribbon geometry: turn a centerline of nodes into a continuous filled band. */

interface Point {
  x: number;
  y: number;
}

/**
 * Build a continuous ribbon from a list of centerline nodes by offsetting each
 * node ±height/2 along its local normal. Returns the SVG path `d` for the filled
 * band and the matching centerline `d` (used as a `<textPath>` track so the
 * warning text flows along the bend).
 */
export function ribbonPaths(
  nodes: readonly Point[],
  height: number,
): { fill: string; center: string } {
  const ht = height / 2;
  const n = nodes.length;
  const top: string[] = [];
  const bot: string[] = [];
  const cen: string[] = [];

  for (let i = 0; i < n; i++) {
    const p = nodes[i];
    const a = nodes[Math.max(0, i - 1)];
    const b = nodes[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const nx = -ty;
    const ny = tx;
    top.push(`${(p.x + nx * ht).toFixed(1)} ${(p.y + ny * ht).toFixed(1)}`);
    bot.push(`${(p.x - nx * ht).toFixed(1)} ${(p.y - ny * ht).toFixed(1)}`);
    cen.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  bot.reverse();

  return {
    fill: `M${top.join(" L")} L${bot.join(" L")} Z`,
    center: `M${cen.join(" L")}`,
  };
}
