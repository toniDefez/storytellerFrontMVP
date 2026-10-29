import type { ClosedRegionType, OpenRegionType, RegionType } from '@/services/factionApi'

// ────────────────────────────────────────────────────────────────────────────
// Faction palette (vibrant, brand-aligned)
// 8 hand-curated colors. Source: design spec §6.3.
// ────────────────────────────────────────────────────────────────────────────

export const FACTION_PALETTE = [
  '#7c3aed', // amethyst
  '#dc2626', // scarlet
  '#ea580c', // amber
  '#ca8a04', // ochre
  '#16a34a', // fern
  '#0891b2', // azure
  '#9333ea', // iris
  '#be185d', // carmine
] as const

export type FactionPaletteColor = (typeof FACTION_PALETTE)[number]

// Default civic node border color when faction_id is null. Spec §6.5.
export const NEUTRAL_CIVIC_BORDER = '#94a3b8' // slate-400

// ────────────────────────────────────────────────────────────────────────────
// Geographic palette (muted, cartographic) — design spec §6.2
// Each region_type maps to fill, stroke, dashed, opacity.
// ────────────────────────────────────────────────────────────────────────────

export interface RegionVisual {
  fill: string
  stroke: string
  strokeDashed: boolean
  fillOpacity: number
  strokeWidth: number
}

/**
 * Terrain palette — opaque and cartographic.
 *
 * The previous values painted every region at 10–20% opacity over a dotted
 * grid. With the handful of decorative blobs the LLM used to emit that read as
 * "subtle"; with the forty regions the procedural engine now produces, every
 * one of them washes out into the same pale smudge with the grid showing
 * through, and the map stops being legible as a map.
 *
 * `sea` carries a thick dark stroke on purpose: the engine does not persist
 * the coastline as its own entity (it is the border between the sea polygon
 * and the land, and duplicating it would let the two drift apart on edit), so
 * the sea's own outline *is* the coast. It is the single strongest visual
 * signal that what you are looking at is a map.
 */
const TERRAIN_PALETTE: Record<RegionType, RegionVisual> = {
  // Water
  sea:      { fill: '#33607f', stroke: '#1d3c52', strokeDashed: false, fillOpacity: 1,    strokeWidth: 5   },
  lake:     { fill: '#4585a8', stroke: '#28617f', strokeDashed: false, fillOpacity: 1,    strokeWidth: 1.5 },
  // Biomes
  desert:   { fill: '#e0cd9c', stroke: '#c9b078', strokeDashed: false, fillOpacity: 1,    strokeWidth: 0.8 },
  plain:    { fill: '#c2cc8d', stroke: '#a5b06e', strokeDashed: false, fillOpacity: 1,    strokeWidth: 0.8 },
  forest:   { fill: '#7d9c66', stroke: '#5f7d4c', strokeDashed: false, fillOpacity: 1,    strokeWidth: 0.8 },
  jungle:   { fill: '#4f7d52', stroke: '#3a6140', strokeDashed: false, fillOpacity: 1,    strokeWidth: 0.8 },
  tundra:   { fill: '#d6dad6', stroke: '#b4bbb6', strokeDashed: false, fillOpacity: 1,    strokeWidth: 0.8 },
  // Relief — drawn *over* the biome, so it keeps a little translucency to let
  // the underlying cover show. A rainy range is mountain forest, not "mountain".
  mountain: { fill: '#8f8069', stroke: '#5f5343', strokeDashed: false, fillOpacity: 0.88, strokeWidth: 1.6 },
  // Rivers arrive as a closed, tapered ribbon: the width lives in the geometry
  // because SVG cannot vary stroke width along a path, and a river of constant
  // thickness reads as a road.
  river:    { fill: '#2d6f9c', stroke: '#245b80', strokeDashed: false, fillOpacity: 1,    strokeWidth: 0   },
  ridge:    { fill: 'none',    stroke: '#5f5343', strokeDashed: false, fillOpacity: 0,    strokeWidth: 3   },
  coast:    { fill: 'none',    stroke: '#1d3c52', strokeDashed: false, fillOpacity: 0,    strokeWidth: 3.5 },
}

export function getRegionVisual(regionType: RegionType): RegionVisual {
  return TERRAIN_PALETTE[regionType]
}

// ────────────────────────────────────────────────────────────────────────────
// Z-index manual layering (spec §6.6)
// Use with `<ReactFlow elevateNodesOnSelect={false}>` and per-node `zIndex`.
// ────────────────────────────────────────────────────────────────────────────

export const Z_INDEX = {
  // Rectángulo del color del mar por debajo de todo. Sin él, el redondeo del
  // anillo del mar en las esquinas del lienzo deja un mordisco visible.
  backdrop: 0,
  sea: 1,            // the ocean's own polygon, over the backdrop
  closedTerrain: 2,  // forest, desert, plain, jungle, tundra
  relief: 4,         // mountain — a layer *over* the cover, not instead of it
  lake: 6,           // inland water sits above the land that encloses it
  openLine: 10,      // rivers, ridges, coasts
  label: 15,         // place names, above the terrain they name
  civic: 20,         // settlement, ruin, structure, wilderness, landmark, passage
  selected: 25,      // any selected node
  /** @deprecated kept so older call sites keep compiling; use `sea`/`lake`. */
  seaLake: 0,
} as const

/**
 * Layering is decided by region TYPE, not by `is_closed`.
 *
 * Rivers are now closed rings (a tapered ribbon), so keying off `is_closed`
 * would file them under terrain and bury them beneath it. And a lake has to
 * sit above the land that encloses it, while the sea has to sit below
 * everything, so the two cannot share a slot either.
 */
export function zIndexForRegion(region: { region_type: RegionType; is_closed: boolean }): number {
  switch (region.region_type) {
    case 'sea':
      return Z_INDEX.sea
    case 'lake':
      return Z_INDEX.lake
    case 'mountain':
      return Z_INDEX.relief
    case 'river':
    case 'ridge':
    case 'coast':
      return Z_INDEX.openLine
    default:
      return Z_INDEX.closedTerrain
  }
}

// Type guards (re-exported for convenience)
const CLOSED_TYPES: ReadonlySet<ClosedRegionType> = new Set([
  'forest', 'desert', 'mountain', 'sea', 'plain', 'lake', 'jungle', 'tundra',
])
const OPEN_TYPES: ReadonlySet<OpenRegionType> = new Set(['river', 'ridge', 'coast'])

export function isClosedRegionType(t: RegionType): t is ClosedRegionType {
  return CLOSED_TYPES.has(t as ClosedRegionType)
}

export function isOpenRegionType(t: RegionType): t is OpenRegionType {
  return OPEN_TYPES.has(t as OpenRegionType)
}
