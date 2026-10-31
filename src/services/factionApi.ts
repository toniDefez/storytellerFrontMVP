import { request } from './api'

// ────────────────────────────────────────────────────────────────────────────
// Faction
// ────────────────────────────────────────────────────────────────────────────

export interface Faction {
  id: number
  world_id: number
  name: string
  color: string
  created_at: string
}


// ────────────────────────────────────────────────────────────────────────────
// Region
// ────────────────────────────────────────────────────────────────────────────

export type ClosedRegionType =
  | 'forest' | 'desert' | 'mountain' | 'sea'
  | 'plain' | 'lake' | 'jungle' | 'tundra'
export type OpenRegionType = 'river' | 'ridge' | 'coast'
export type RegionType = ClosedRegionType | OpenRegionType

export interface RegionVertex {
  id: number
  region_id: number
  order_index: number
  canvas_x: number
  canvas_y: number
}

/**
 * De dónde sale la geometría de una región.
 *
 * `procedural` la calculó el motor y una regeneración la sustituye.
 * `user` la dibujó o la retocó una persona, y el motor no la toca: retocar
 * los vértices de una región derivada la pasa a `user` en el servidor.
 */
export type RegionOrigin = 'procedural' | 'user'

export interface Region {
  id: number
  world_id: number
  name: string
  region_type: RegionType
  color: string
  z_index: number
  is_closed: boolean
  origin: RegionOrigin
  created_at: string
  vertices: RegionVertex[]
}

// ────────────────────────────────────────────────────────────────────────────
// API functions — Factions
// ────────────────────────────────────────────────────────────────────────────

export function listFactions(worldId: number) {
  return request<Faction[]>(`/factions?world_id=${worldId}`)
}

// ────────────────────────────────────────────────────────────────────────────
// API functions — Regions
// ────────────────────────────────────────────────────────────────────────────

export function listRegions(worldId: number) {
  return request<Region[]>(`/regions?world_id=${worldId}`)
}

// ────────────────────────────────────────────────────────────────────────────
// Geography generation
// ────────────────────────────────────────────────────────────────────────────

export interface GenerateGeographyResponse {
  regions: Region[]
  factions: Faction[]
}

export function generateGeography(worldId: number) {
  return request<GenerateGeographyResponse>('/world/generate-geography', {
    method: 'POST',
    body: JSON.stringify({ world_id: worldId }),
  })
}

/**
 * Regenera la capa social.
 *
 * Va en su propia ruta porque no es parte del sustrato físico: esto llama a un
 * modelo de lenguaje y puede tardar decenas de segundos, mientras el mapa es
 * determinista y local. Estuvieron juntas, y generar el mapa esperaba el
 * timeout de esta llamada.
 */
export function generateFactions(worldId: number) {
  return request<{ factions: Faction[] }>('/world/generate-factions', {
    method: 'POST',
    body: JSON.stringify({ world_id: worldId }),
  })
}
