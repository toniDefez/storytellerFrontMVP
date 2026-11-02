import { request } from './api'

// Facciones: el sello (nombre, color). «Manda aquí» y «y contigo» llegan en
// el plan de facciones (escena 0, corte aparte).

export interface Faction {
  id: number
  world_id: number
  name: string
  color: string
  created_at: string
}

export function listFactions(worldId: number) {
  return request<Faction[]>(`/factions?world_id=${worldId}`)
}
