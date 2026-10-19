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

export type FactionInput = Pick<Faction, 'world_id' | 'name' | 'color'>
export type FactionPatch = Pick<Faction, 'name' | 'color'>

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

export type RegionInput = Pick<
  Region,
  'world_id' | 'name' | 'region_type' | 'color' | 'z_index' | 'is_closed' | 'vertices'
>
export type RegionPatch = Pick<Region, 'name' | 'region_type' | 'color' | 'z_index'>

// ────────────────────────────────────────────────────────────────────────────
// API functions — Factions
// ────────────────────────────────────────────────────────────────────────────

export function listFactions(worldId: number) {
  return request<Faction[]>(`/factions?world_id=${worldId}`)
}

export function getFaction(id: number) {
  return request<Faction>(`/faction/get?id=${id}`)
}

export function createFaction(input: FactionInput) {
  return request<Faction>('/faction', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateFaction(id: number, patch: FactionPatch) {
  return request<void>(`/faction/update?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}

export function deleteFaction(id: number) {
  return request<void>(`/faction/delete?id=${id}`, { method: 'DELETE' })
}

// ────────────────────────────────────────────────────────────────────────────
// API functions — Regions
// ────────────────────────────────────────────────────────────────────────────

export function listRegions(worldId: number) {
  return request<Region[]>(`/regions?world_id=${worldId}`)
}

export function getRegion(id: number) {
  return request<Region>(`/region/get?id=${id}`)
}

export function createRegion(input: RegionInput) {
  return request<Region>('/region', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateRegion(id: number, patch: RegionPatch) {
  return request<void>(`/region/update?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}

export function deleteRegion(id: number) {
  return request<void>(`/region/delete?id=${id}`, { method: 'DELETE' })
}

export type RegionVertexInput = Pick<RegionVertex, 'order_index' | 'canvas_x' | 'canvas_y'>

/**
 * Replace a region's full vertex list.
 *
 * The handler requires PUT (it 405s on anything else) and unmarshals into
 * `dto.ReplaceVerticesRequest`, which wraps the list in a `vertices` key —
 * a bare array is silently parsed as an empty request. Both details were
 * wrong here until Slice A, harmlessly: nothing called this function.
 */
export function replaceRegionVertices(
  regionId: number,
  vertices: RegionVertexInput[]
) {
  return request<void>(`/region/vertices/replace?id=${regionId}`, {
    method: 'PUT',
    body: JSON.stringify({ vertices }),
  })
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
