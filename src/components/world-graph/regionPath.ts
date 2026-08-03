/**
 * Path building for region geometry.
 *
 * The engine persists polygons that come out of a raster grid, so their raw
 * outlines are faceted: drawn as straight segments they read as a polygonal
 * diagram, not as a coastline. Smoothing happens *here*, at render time, and
 * never in the stored geometry — that way the database keeps ~60 vertices a
 * human can drag, while the canvas shows a continuous curve.
 *
 * Ported from `internal/worldgen` (svg reference render) so the app and the
 * engine's own preview draw the same shapes.
 */

export interface Point {
  x: number
  y: number
}

/**
 * Catmull-Rom tension, expressed as the divisor applied to the neighbour
 * delta when deriving Bézier control points. Higher means tighter curves.
 * 6 tracks the stored vertices closely while removing the facets; lower
 * values start to bulge past the real coastline.
 */
const TENSION = 6

/**
 * Convert a polyline into an SVG path of cubic Béziers.
 *
 * `closed` wraps the control points around the ends, so a ring has no seam.
 * Fewer than three points can't be smoothed and fall back to a straight line.
 */
export function buildSmoothPath(points: readonly Point[], closed: boolean): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${f(points[0].x)} ${f(points[0].y)} L ${f(points[1].x)} ${f(points[1].y)}`
  }

  const n = points.length
  const at = (i: number): Point => {
    if (closed) return points[((i % n) + n) % n]
    if (i < 0) return points[0]
    if (i >= n) return points[n - 1]
    return points[i]
  }

  const parts: string[] = [`M ${f(points[0].x)} ${f(points[0].y)}`]
  const last = closed ? n : n - 1

  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)

    const c1x = p1.x + (p2.x - p0.x) / TENSION
    const c1y = p1.y + (p2.y - p0.y) / TENSION
    const c2x = p2.x - (p3.x - p1.x) / TENSION
    const c2y = p2.y - (p3.y - p1.y) / TENSION

    parts.push(`C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(p2.x)} ${f(p2.y)}`)
  }

  if (closed) parts.push('Z')
  return parts.join(' ')
}

/**
 * Signed-area centroid of a ring, used to place its label.
 *
 * The plain average of the vertices is pulled towards whichever side has more
 * of them, which on a coastline (dense where it is ragged) drags the label off
 * the region. Falls back to the vertex average for degenerate rings.
 */
export function polygonCentroid(points: readonly Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 }

  let twiceArea = 0
  let cx = 0
  let cy = 0

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const cross = points[j].x * points[i].y - points[i].x * points[j].y
    twiceArea += cross
    cx += (points[j].x + points[i].x) * cross
    cy += (points[j].y + points[i].y) * cross
  }

  if (Math.abs(twiceArea) < 1e-9) {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
    return { x: sum.x / points.length, y: sum.y / points.length }
  }

  return { x: cx / (3 * twiceArea), y: cy / (3 * twiceArea) }
}

/** Absolute polygon area (shoelace). Used to rank and size labels. */
export function polygonArea(points: readonly Point[]): number {
  let twiceArea = 0
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    twiceArea += points[j].x * points[i].y - points[i].x * points[j].y
  }
  return Math.abs(twiceArea) / 2
}

/** One decimal is plenty at canvas scale and keeps path strings short. */
function f(v: number): string {
  return v.toFixed(1)
}
