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
}

const TERRAIN_PALETTE: Record<RegionType, RegionVisual> = {
  // Closed (filled polygons)
  mountain: { fill: '#5e4e3a', stroke: '#3d3225', strokeDashed: true,  fillOpacity: 0.12 },
  forest:   { fill: '#2d6a4f', stroke: '#1b4332', strokeDashed: true,  fillOpacity: 0.15 },
  jungle:   { fill: '#2d6a4f', stroke: '#1b4332', strokeDashed: true,  fillOpacity: 0.15 },
  desert:   { fill: '#c9a35a', stroke: '#a0843a', strokeDashed: true,  fillOpacity: 0.18 },
  plain:    { fill: '#a8b87a', stroke: '#a8b87a', strokeDashed: false, fillOpacity: 0.10 },
  tundra:   { fill: '#cbd5e1', stroke: '#94a3b8', strokeDashed: true,  fillOpacity: 0.20 },
  sea:      { fill: '#1e3a8a', stroke: '#1e40af', strokeDashed: false, fillOpacity: 0.18 },
  lake:     { fill: '#1e3a8a', stroke: '#1e40af', strokeDashed: false, fillOpacity: 0.18 },
  // Open (no fill)
  river:    { fill: 'none',    stroke: '#0e7490', strokeDashed: false, fillOpacity: 0    },
  ridge:    { fill: 'none',    stroke: '#3d3225', strokeDashed: false, fillOpacity: 0    },
  coast:    { fill: 'none',    stroke: '#0e7490', strokeDashed: false, fillOpacity: 0    },
}

export function getRegionVisual(regionType: RegionType): RegionVisual {
  return TERRAIN_PALETTE[regionType]
}

// ────────────────────────────────────────────────────────────────────────────
// Z-index manual layering (spec §6.6)
// Use with `<ReactFlow elevateNodesOnSelect={false}>` and per-node `zIndex`.
// ────────────────────────────────────────────────────────────────────────────

export const Z_INDEX = {
  seaLake: 0,        // deepest
  closedTerrain: 2,  // forest, desert, plain, mountain, jungle, tundra
  openLine: 10,      // rivers, ridges, coasts
  civic: 20,         // settlement, ruin, structure, wilderness, landmark, passage
  selected: 25,      // any selected node
  // Vertex handles sit above everything. This slot was reserved at 5 for
  // symmetry with the terrain layers, but a handle must be grabbable: at 5 it
  // would render beneath the very river (10) it edits, and beneath any civic
  // node (20) that happens to overlap it.
  vertex: 30,
} as const

// ────────────────────────────────────────────────────────────────────────────
// Vertex handles (Slice A — manual geometry editing)
// ────────────────────────────────────────────────────────────────────────────

/** Radius in canvas px. Node boxes are 2r; positions are offset by r to center. */
export const VERTEX_HANDLE_RADIUS = 5

export const VERTEX_HANDLE = {
  fill: '#ffffff',
  stroke: '#14b8a6',   // teal — same accent used for selection elsewhere
  strokeWidth: 2,
} as const

export function zIndexForRegion(region: { region_type: RegionType; is_closed: boolean }): number {
  if (!region.is_closed) return Z_INDEX.openLine
  if (region.region_type === 'sea' || region.region_type === 'lake') return Z_INDEX.seaLake
  return Z_INDEX.closedTerrain
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
