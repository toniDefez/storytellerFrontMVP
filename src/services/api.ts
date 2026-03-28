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

// --- World ---

export interface World {
  id: number
  name: string
  description: string
  premise: string
  root_node_id?: number
}

export interface CharacterBrief {
  id: number
  name: string
}

export interface SceneBrief {
  id: number
  title: string
  position: number
}

export interface WorldDetail {
  id: number
  name: string
  summary: string
  premise: string
  characters: CharacterBrief[]
  scenes: SceneBrief[]
}

export function getWorldDetail(id: number) {
  return request<WorldDetail>(`/world-detail/get?id=${id}`)
}

// --- World Graph (causal tree) ---

export type NodeDomain = 'core' | 'physical' | 'biological' | 'social' | 'symbolic' | 'technic'
export type NodeRole = 'state' | 'event' | 'rupture'
export type EdgeType = 'requires' | 'produces' | 'enables' | 'undermines' | 'gives_rise_to'

export interface NodeContent {
  description: string
  causal_summary: string
}

export interface WorldNode {
  id: number
  world_id: number
  parent_id?: number
  parent_edge_type?: EdgeType
  domain: NodeDomain
  role: NodeRole
  label: string
  content: NodeContent
  position_order: number
}

export interface WorldGraph {
  world_id: number
  premise: string
  nodes: WorldNode[]
}

export interface SubtreePreview {
  node_count: number
  labels: string[]
}

export interface TensionOption {
  id: string
  label: string
  description: string
}

export interface CandidateNode {
  domain: NodeDomain
  role: NodeRole
  label: string
  description: string
  parent_edge_type: EdgeType
}

export function getWorlds() {
  return request<World[]>('/worlds')
}

export function getWorldById(id: number) {
  return request<World>(`/world/get?id=${id}`)
}

export function createWorld(name: string, premise: string, description: string) {
  return request<{ id: number }>('/world', {
    method: 'POST',
    body: JSON.stringify({ name, premise, description }),
  })
}

export function updateWorld(id: number, input: { name?: string; description?: string; premise?: string }) {
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

// --- World Graph API ---

export function getWorldGraph(worldId: number) {
  return request<WorldGraph>(`/world/graph?world_id=${worldId}`)
}

export function suggestPremises() {
  return request<{ premises: string[] }>('/world/suggest-premises', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export function interpretTensions(premise: string) {
  return request<{ options: TensionOption[] }>('/world/interpret-tensions', {
    method: 'POST',
    body: JSON.stringify({ premise }),
  })
}

export function generateRoot(worldId: number, tension: string) {
  return request<WorldNode>(`/world/generate-root?world_id=${worldId}`, {
    method: 'POST',
    body: JSON.stringify({ tension }),
  })
}

export function createNode(worldId: number, node: {
  parent_id?: number
  parent_edge_type?: EdgeType
  domain: NodeDomain
  role: NodeRole
  label: string
  description: string
  causal_summary?: string
  position_order: number
}) {
  return request<WorldNode>(`/world/nodes?world_id=${worldId}`, {
    method: 'POST',
    body: JSON.stringify(node),
  })
}

export function updateNode(worldId: number, nodeId: number, data: {
  label: string
  domain: NodeDomain
  role: NodeRole
  description: string
  causal_summary: string
}) {
  return request<WorldNode>(`/world/nodes?world_id=${worldId}&node_id=${nodeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function expandNodeCandidates(worldId: number, nodeId: number) {
  return request<{ candidates: CandidateNode[] }>(
    `/world/nodes/expand?world_id=${worldId}&node_id=${nodeId}`,
    { method: 'POST' },
  )
}

export function graphChat(worldId: number, message: string) {
  return request<{ reply: string; created_nodes?: WorldNode[] }>(`/world/graph/chat?world_id=${worldId}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export function generateWorld(premise: string) {
  return request<{ job_id: string }>('/world/generate', {
    method: 'POST',
    body: JSON.stringify({ premise }),
  })
}

export function getJobStatus(jobId: string) {
  return request<{ status: 'pending' | 'done' | 'error'; world_id: number; error: string }>(
    `/jobs/status?id=${jobId}`
  )
}

export function getSubtreePreview(worldId: number, nodeId: number) {
  return request<SubtreePreview>(`/world/nodes/subtree?world_id=${worldId}&node_id=${nodeId}`)
}

export function deleteSubtree(worldId: number, nodeId: number) {
  return request<{ deleted_ids: number[] }>(
    `/world/nodes/subtree/delete?world_id=${worldId}&node_id=${nodeId}`,
    { method: 'DELETE' },
  )
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
  machine_name: string
  version: string
  status: string
  last_seen_at: string
  created_at: string
  model?: string
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

export function revokeInstallation() {
  return request<{ status: string }>('/installation/revoke', { method: 'DELETE' })
}

// ────────────────────────────────────────────────────────────────────────────
// Location graph
// ────────────────────────────────────────────────────────────────────────────

export type LocationNodeType = 'settlement' | 'wilderness' | 'ruin' | 'landmark' | 'passage' | 'structure'
export type LocationEdgeType = 'road' | 'wilderness' | 'waterway'
export type LocationEffort = 'easy' | 'moderate' | 'difficult'

export interface LocationNodeProperties {
  atmosphere?: string
  social_filter?: string
  behavioral_rule?: string
  control?: string
  duration?: 'permanent' | 'temporary' | 'declining' | 'emerging'
}

export interface LocationNode {
  id: number
  world_id: number
  name: string
  node_type: LocationNodeType
  description: string
  properties: LocationNodeProperties
  canvas_x: number
  canvas_y: number
}

export interface LocationEdge {
  id: number
  world_id: number
  source_node_id: number
  target_node_id: number
  edge_type: LocationEdgeType
  effort: LocationEffort
  bidirectional: boolean
  note: string
}

export interface LocationGraph {
  nodes: LocationNode[]
  edges: LocationEdge[]
}

export function getLocationGraph(worldId: number) {
  return request<LocationGraph>(`/location/graph?world_id=${worldId}`)
}

export function createLocationNode(node: Omit<LocationNode, 'id'>) {
  return request<LocationNode>('/location/nodes', { method: 'POST', body: JSON.stringify(node) })
}

export function updateLocationNode(id: number, data: Pick<LocationNode, 'name' | 'node_type' | 'description' | 'properties'>) {
  return request<void>(`/location/nodes/update?id=${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function updateLocationNodePosition(id: number, canvas_x: number, canvas_y: number) {
  return request<void>(`/location/nodes/position?id=${id}`, { method: 'PATCH', body: JSON.stringify({ canvas_x, canvas_y }) })
}

export function deleteLocationNode(id: number) {
  return request<void>(`/location/nodes/delete?id=${id}`, { method: 'DELETE' })
}

export function createLocationEdge(edge: Omit<LocationEdge, 'id'>) {
  return request<LocationEdge>('/location/edges', { method: 'POST', body: JSON.stringify(edge) })
}

export function updateLocationEdge(id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'bidirectional' | 'note'>) {
  return request<void>(`/location/edges/update?id=${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteLocationEdge(id: number) {
  return request<void>(`/location/edges/delete?id=${id}`, { method: 'DELETE' })
}

export function generateLocationGraph(worldId: number, nodeCountHint = 12) {
  return request<LocationGraph>('/location/generate', {
    method: 'POST',
    body: JSON.stringify({ world_id: worldId, node_count_hint: nodeCountHint }),
  })
}
