const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function getToken(): string {
  return localStorage.getItem('token') || ''
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || body.message || `Error ${res.status}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : ({} as T)
}

// --- Auth ---

export function login(username: string, password: string) {
  return request<{ status: string; token: string; userID: number }>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function register(username: string, password: string) {
  return request<{ status: string }>('/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function validateToken() {
  return request<{ status: string }>('/validate-token', {
    method: 'POST',
    body: JSON.stringify({ token: getToken() }),
  })
}

// --- Worlds ---

// --- Structured environment types ---
export type TerrainFeatureType = 'mountain' | 'plain' | 'valley' | 'plateau' | 'canyon' | 'island' | 'cave' | 'coast' | 'desert' | 'forest' | 'swamp' | 'volcano' | 'glacier' | 'floating'

export interface TerrainFeature {
  name: string
  type: TerrainFeatureType
  description: string
}

export interface StructuredEnvironment {
  terrain_features: TerrainFeature[]
  climate: string
  water_system: string
  light_regime: string
  gravity: string
  atmosphere: string
  unique_phenomenon: string
}

// --- Structured ecosystem types ---
export type TrophicLevel = 'producer' | 'primary_consumer' | 'secondary_consumer' | 'apex_predator' | 'decomposer'
export type EcologicalRelationType = 'predation' | 'herbivory' | 'mutualism' | 'parasitism' | 'competition' | 'decomposition'

export interface StructuredOrganism {
  name: string
  trophic_level: TrophicLevel
  habitat: string
  description: string
}

export interface EcologicalRelation {
  source: string
  target: string
  type: EcologicalRelationType
}

export interface ExtractableResource {
  name: string
  source: string
  use: string
}

export interface StructuredEcosystem {
  energy_source: string
  organisms: StructuredOrganism[]
  relationships: EcologicalRelation[]
  keystone_species: string
  extractable_resources: ExtractableResource[]
}

// --- Structured faction types ---
export type PowerBasis = 'military' | 'economic' | 'ritual' | 'land' | 'labor' | 'information'
export type WorldWoundRelation = 'caused' | 'benefits' | 'suffers' | 'ignores'
export type FactionRelationType = 'dependency' | 'conflict' | 'instrumentalization'

export interface StructuredFaction {
  name: string
  tier: FactionPowerTier
  power_basis: PowerBasis
  resource_controlled: string
  world_wound_relation: WorldWoundRelation
  internal_pressure: string
}

export interface FactionRelation {
  source: string
  target: string
  type: FactionRelationType
  notes: string
}

export interface World {
  id: number
  name: string
  factions: string[]
  description: string
  core_axis: string
  environment: string
  subsistence: string
  organization: string
  tensions: string
  tone: string
  structured_factions?: StructuredFaction[]
  faction_relations?: FactionRelation[]
  structured_environment?: StructuredEnvironment
  structured_ecosystem?: StructuredEcosystem
}

export function getWorlds() {
  return request<World[]>('/worlds')
}

export function getWorldById(id: number) {
  return request<World>(`/world/get?id=${id}`)
}

export function createWorld(world: Omit<World, 'id'>) {
  return request<World>('/world', {
    method: 'POST',
    body: JSON.stringify(world),
  })
}

export type WorldLayerType = 'physical' | 'biological' | 'society' | 'synthesis'

export interface DeriveLayerResult {
  layer: WorldLayerType
  content: string
  tensions?: string                        // society layer only
  name?: string                            // synthesis layer only
  factions?: string[]                      // synthesis layer only
  description?: string                     // synthesis layer only
  structuredFactions?: StructuredFaction[]  // synthesis layer only (camelCase from Go backend)
  factionRelations?: FactionRelation[]     // synthesis layer only (camelCase from Go backend)
  structuredEnvironment?: StructuredEnvironment  // physical layer (camelCase from Go backend)
  structuredEcosystem?: StructuredEcosystem      // biological layer (camelCase from Go backend)
}

export function deriveWorldLayer(
  coreAxis: string,
  layer: WorldLayerType,
  previousLayers: Partial<Record<WorldLayerType, string>>,
  layerParameters?: Record<string, string | string[]>,
) {
  return request<DeriveLayerResult>('/world/derive-layer', {
    method: 'POST',
    body: JSON.stringify({
      core_axis: coreAxis,
      layer,
      previous_layers: previousLayers,
      physical_parameters: layerParameters,  // backward compat for physical layer
      layer_parameters: layerParameters,     // generic field for all layers
    }),
  })
}

export function updateWorld(id: number, input: Partial<Omit<World, 'id'>>) {
  return request<World>(`/world/update?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteWorld(id: number) {
  return request<{ status: string }>(`/world/delete?id=${id}`, {
    method: 'DELETE',
  })
}

// --- World Detail ---

export type ConsciousnessState = 'dormido' | 'inquieto' | 'despierto' | 'explotador' | 'subversivo'
export type FactionPowerTier   = 0 | 1 | 2
export type GoalCategory       = 'world_tension' | 'subversive' | 'personal'

export interface StructuredGoal {
  text: string
  category: GoalCategory
}

export interface Character {
  id: number
  name: string
  role: string
  personality: string
  background: string
  goals: string[]
  world_id: number
  state: Record<string, string>
  // prose derivation fields
  premise?: string
  social_position?: string
  internal_contradiction?: string
  relation_to_collective_lie?: string
  personal_fear?: string
  faction_affiliation?: string
  // structured fields powering visualizations directly (no heuristics)
  consciousness_state?: ConsciousnessState
  faction_power_tier?: FactionPowerTier
  contradiction_declared?: string
  contradiction_operative?: string
  structured_goals?: StructuredGoal[]
}

export interface Scene {
  id: number
  title: string
  location: string
  time: string
  tone: string
  context: string
  world_id: number
  position?: number
}

export interface WorldDetail {
  world: World
  characters: Character[]
  scenes: Scene[]
}

export function getWorldDetail(id: number) {
  return request<WorldDetail>(`/world-detail/get?id=${id}`)
}

// --- Characters ---

export function createCharacter(character: Omit<Character, 'id'>) {
  return request<{ id: number }>('/character', {
    method: 'POST',
    body: JSON.stringify(character),
  })
}

export function generateCharacter(worldId: number, description: string) {
  return request<Character>('/character/generate', {
    method: 'POST',
    body: JSON.stringify({ world_id: worldId, description }),
  })
}

export function getCharacterById(id: number) {
  return request<Character>(`/character/get?id=${id}`)
}

export function updateCharacter(id: number, character: Omit<Character, 'id'>) {
  return request<Character>(`/character/update?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(character),
  })
}

export function deleteCharacter(id: number) {
  return request<{ status: string }>(`/character/delete?id=${id}`, {
    method: 'DELETE',
  })
}

// --- Scenes ---

export function createScene(scene: Omit<Scene, 'id'>) {
  return request<{ id: number }>('/scene', {
    method: 'POST',
    body: JSON.stringify(scene),
  })
}

export function generateScene(worldId: number, description: string) {
  return request<Scene>('/scene/generate', {
    method: 'POST',
    body: JSON.stringify({ world_id: worldId, description }),
  })
}

export function getSceneById(id: number) {
  return request<Scene>(`/scene/get?id=${id}`)
}

export function updateScene(id: number, input: Partial<Omit<Scene, 'id' | 'world_id'>>) {
  return request<Scene>(`/scene/update?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteScene(id: number) {
  return request<{ status: string }>(`/scene/delete?id=${id}`, {
    method: 'DELETE',
  })
}

export function addCharacterToScene(sceneId: number, characterId: number) {
  return request<{ message: string }>('/scene-add-character', {
    method: 'POST',
    body: JSON.stringify({ scene_id: sceneId, character_id: characterId }),
  })
}

export function getSceneCharacters(sceneId: number) {
  return request<Character[]>(`/scene/character/get?id=${sceneId}`)
}

// --- Scene Detail ---

export interface Event {
  id: number
  scene_id: number
  character_ids: number[]
  action: string
  spot: string
  position: number
}

export interface SceneDetail {
  scene: Scene
  characters: Character[]
  events: Event[]
}

export function getSceneDetail(id: number) {
  return request<SceneDetail>(`/scene-detail/get?id=${id}`)
}

// --- Events ---

export function createEvent(event: Omit<Event, 'id'>) {
  return request<{ id: number }>('/event', {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

export function generateEvents(sceneId: number, characterIds: number[], description: string, numEvents: number) {
  return request<{ events: Event[] }>('/event/generate', {
    method: 'POST',
    body: JSON.stringify({ scene_id: sceneId, character_ids: characterIds, description, num_events: numEvents }),
  })
}

export function deleteEvent(id: number) {
  return request<{ status: string }>(`/event/delete?id=${id}`, {
    method: 'DELETE',
  })
}

// --- Narrative ---

export interface SceneNarrative {
  text: string
}

export function getSceneNarrative(sceneId: number) {
  return request<SceneNarrative>(`/scene/narrative/get?id=${sceneId}`)
}

export function regenerateNarrative(sceneId: number, feedback: string, existingNarrative: string) {
  return request<SceneNarrative>('/scene/narrative/regenerate', {
    method: 'POST',
    body: JSON.stringify({ scene_id: sceneId, feedback, existing_narrative: existingNarrative }),
  })
}

// --- Installation ---

export interface Installation {
  id: number
  user_id: number
  machine_name: string
  os: string
  arch: string
  version: string
  ip: string
  port: number
  status: string
  last_seen_at: string
  created_at: string
  channel_id: string
}

export async function getMyInstallation(): Promise<Installation | null> {
  const res = await fetch(`${API_URL}/installation/me`, {
    headers: authHeaders(),
  })
  if (res.status === 204) return null
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || body.message || `Error ${res.status}`)
  }
  return res.json()
}

export function getLinkingToken() {
  return request<{ token: string }>('/installation/linking-token')
}

// --- World Graph ---

export interface GraphNode {
  id: string
  label: string
  domain: 'physical' | 'biological' | 'social' | 'core'
  description?: string
}

export interface GraphEdge {
  source: string
  target: string
  label?: string
}

export interface WorldGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function generateWorldGraph(phrase: string) {
  return request<WorldGraphData>('/world/generate-graph', {
    method: 'POST',
    body: JSON.stringify({ phrase }),
  })
}

export function expandGraphNode(nodeId: string, nodeLabel: string, currentGraph: WorldGraphData) {
  return request<WorldGraphData>('/world/expand-node', {
    method: 'POST',
    body: JSON.stringify({ node_id: nodeId, node_label: nodeLabel, current_graph: currentGraph }),
  })
}

export function graphChat(message: string, currentGraph: WorldGraphData) {
  return request<{ reply: string; patch?: WorldGraphData }>('/world/graph-chat', {
    method: 'POST',
    body: JSON.stringify({ message, current_graph: currentGraph }),
  })
}

export function createWorldFromGraph(graph: WorldGraphData) {
  return request<{ id: number }>('/world/create-from-graph', {
    method: 'POST',
    body: JSON.stringify({ graph }),
  })
}
