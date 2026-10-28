import { ApiError, newRequestId, reportClientError } from './telemetry'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/** Dirección del backend, para los comandos que el usuario ejecuta en su equipo. */
export const apiUrl = () => API_URL

function getToken(): string {
  return localStorage.getItem('token') || ''
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

/**
 * Todas las llamadas a la API pasan por aquí. Cada una lleva un X-Request-ID
 * (el que se pase, para seguir su progreso, o uno nuevo) y los fallos salen
 * como ApiError con ese identificador. Los 5xx y los fallos de red se
 * informan al backend: son los que el usuario sufre sin poder arreglar.
 */
export async function request<T>(path: string, options?: RequestInit & { requestId?: string }): Promise<T> {
  const requestId = options?.requestId ?? newRequestId()
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...authHeaders(), 'X-Request-ID': requestId, ...options?.headers },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fallo de red'
    reportClientError({ source: `fetch ${path}`, message, request_id: requestId })
    throw new ApiError(`No se pudo conectar con el servidor (${message})`, 0, requestId)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = body.error || body.message || `Error ${res.status}`
    if (res.status >= 500) {
      reportClientError({ source: `api ${path}`, message, request_id: requestId, status: res.status })
    }
    throw new ApiError(message, res.status, requestId)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : ({} as T)
}

// --- Telemetry ---

export interface GenerationRun {
  id: number
  kind: string
  status: 'running' | 'ok' | 'error'
  phase: string
  phases: { name: string; ms: number }[]
  error?: string
  started_at: string
  duration_ms?: number
}

/** Las generaciones de una petición, con la fase en curso. */
export function getGenerationProgress(requestId: string) {
  // draft: el texto que el escritor lleva hasta ahora, mientras la escena se genera.
  return request<{ request_id: string; runs: GenerationRun[]; draft?: string }>(`/telemetry/progress/${requestId}`)
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

export interface WorldDetail {
  id: number
  name: string
  summary: string
  premise: string
  characters: CharacterBrief[]
  stories: StoryBrief[]
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

export interface PremiseAnalysis {
  entorno: 'PRESENTE' | 'AUSENTE'
  regla: 'PRESENTE' | 'AUSENTE'
  tension: 'PRESENTE' | 'AUSENTE'
  stakes: 'PRESENTE' | 'AUSENTE'
}

export function refinePremise(premise: string) {
  return request<{ analysis: PremiseAnalysis; premise: string }>('/world/refine-premise', {
    method: 'POST',
    body: JSON.stringify({ premise }),
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

export interface Character {
  id: number
  name: string
  world_id: number
  premise?: string
  voice_register?: VoiceRegister
  speech_pattern?: string
}

// --- Character Psychological Graph ---

export type CharacterNodeDomain = 'origin' | 'drive' | 'fear' | 'mask' | 'bond'
export type CharacterNodeRole = 'trait' | 'wound' | 'arc_seed'
export interface CharacterNode {
  id: number
  domain: CharacterNodeDomain
  role: CharacterNodeRole
  label: string
  description: string
  salience: number
  arc_destination?: string
  canvas_x: number
  canvas_y: number
}

export interface CharacterGraph {
  nodes: CharacterNode[]
}

export interface VoiceExample {
  id?: number
  user_text: string
  char_text: string
}

export interface VoiceRegister {
  emotional_rhythm: string
  social_posture: string
  cognitive_tempo: string
  expressive_style: string
  voice_examples?: VoiceExample[]
}

export interface ChatMessage {
  id: number
  role: 'user' | 'character'
  content: string
  created_at?: string
}

// --- Characters ---

export function createCharacter(character: Omit<Character, 'id'>) {
  return request<{ id: number }>('/character', {
    method: 'POST',
    body: JSON.stringify(character),
  })
}

export function getCharacterById(id: number) {
  return request<Character>(`/character/get?id=${id}`)
}

export function deleteCharacter(id: number) {
  return request<{ status: string }>(`/character/delete?id=${id}`, {
    method: 'DELETE',
  })
}

// --- Character Graph ---

export function getCharacterGraph(characterId: number) {
  return request<CharacterGraph>(`/character/graph?character_id=${characterId}`)
}

export function createCharacterNode(characterId: number, node: Omit<CharacterNode, 'id'>) {
  return request<CharacterNode>(`/character/nodes?character_id=${characterId}`, {
    method: 'POST',
    body: JSON.stringify(node),
  })
}

export function updateCharacterNode(nodeId: number, node: Partial<CharacterNode>) {
  return request<void>(`/character/nodes/update?node_id=${nodeId}`, {
    method: 'PUT',
    body: JSON.stringify(node),
  })
}

export function deleteCharacterNode(nodeId: number) {
  return request<void>(`/character/nodes/delete?node_id=${nodeId}`, {
    method: 'DELETE',
  })
}

export function updateNodePosition(nodeId: number, x: number, y: number) {
  return request<void>(`/character/nodes/position?node_id=${nodeId}`, {
    method: 'PUT',
    body: JSON.stringify({ canvas_x: x, canvas_y: y }),
  })
}

// --- Voice Options Catalog ---

export interface VoiceOption {
  id: number
  dimension: string
  value: string
  label: string
  description: string
}

export function getVoiceOptions() {
  return request<VoiceOption[]>('/voice/options')
}

export function getVoiceSelections(characterId: number) {
  return request<VoiceOption[]>(`/character/voice-selections?character_id=${characterId}`)
}

export function saveVoiceSelections(characterId: number, optionIds: number[]) {
  return request<void>(`/character/voice-selections?character_id=${characterId}`, {
    method: 'PUT',
    body: JSON.stringify({ option_ids: optionIds }),
  })
}

export function updateVoiceRegister(characterId: number, vr: VoiceRegister) {
  return request<void>(`/character/voice-register?character_id=${characterId}`, {
    method: 'PUT',
    body: JSON.stringify(vr),
  })
}

export function getVoiceExamples(characterId: number) {
  return request<VoiceExample[]>(`/character/voice-examples?character_id=${characterId}`)
}

export function saveVoiceExamples(characterId: number, examples: VoiceExample[]) {
  return request<void>(`/character/voice-examples?character_id=${characterId}`, {
    method: 'PUT',
    body: JSON.stringify({ examples }),
  })
}

export function generateVoiceExamples(characterId: number) {
  return request<VoiceExample[]>(`/character/voice-examples/generate?character_id=${characterId}`, {
    method: 'POST',
  })
}

export function updateSpeechPattern(characterId: number, speechPattern: string) {
  return request<{ status: string }>('/character/speech-pattern?id=' + characterId, {
    method: 'POST',
    body: JSON.stringify({ speech_pattern: speechPattern }),
  })
}

/** requestId: para seguir la fase con getGenerationProgress mientras tarda. */
export function generateCharacterNodes(characterId: number, premise: string, profileId?: number, requestId?: string) {
  return request<{ nodes: CharacterNode[]; voice_register: VoiceRegister }>(`/character/generate-nodes?character_id=${characterId}`, {
    method: 'POST',
    body: JSON.stringify({ premise, profile_id: profileId }),
    requestId,
  })
}

export function characterChat(characterId: number, message: string) {
  return request<{ reply: string; proposed_node?: CharacterNode }>(`/character/chat?character_id=${characterId}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export function getCharacterChatHistory(characterId: number) {
  return request<ChatMessage[]>(`/character/chat/history?character_id=${characterId}`)
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

/** Código corto para vincular un equipo: vale una vez y 10 minutos. */
export function createPairingCode() {
  return request<{ code: string; expires_at: string }>('/installation/pairing-code', { method: 'POST' })
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
export type NarrativeFunction = 'conflict' | 'origin' | 'threshold' | 'atmosphere'
export type DramaticCharge = 'low' | 'medium' | 'high'

export interface LocationNodeProperties {
  atmosphere?: string
  social_filter?: string
  behavioral_rule?: string
  control?: string
  duration?: 'permanent' | 'temporary' | 'declining' | 'emerging'
  /** Por qué está donde está en el mapa ("junto a un vado"); lo pone el backend al colocarla. */
  emplazamiento?: string
  /** Dónde la colocó el mapa por última vez; si el autor la mueve, el mapa la respeta. */
  map_pos?: [number, number]
}

export interface LocationNode {
  id: number
  world_id: number
  parent_id?: number | null
  name: string
  node_type: LocationNodeType
  description: string
  properties: LocationNodeProperties
  narrative_function?: NarrativeFunction
  source_hint?: string
  canvas_x: number
  canvas_y: number
  faction_id?: number | null
}

export interface LocationEdge {
  id: number
  world_id: number
  source_node_id: number
  target_node_id: number
  edge_type: LocationEdgeType
  effort: LocationEffort
  dramatic_charge: DramaticCharge
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

export function updateLocationEdge(id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'dramatic_charge' | 'bidirectional' | 'note'>) {
  return request<void>(`/location/edges/update?id=${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteLocationEdge(id: number) {
  return request<void>(`/location/edges/delete?id=${id}`, { method: 'DELETE' })
}

/** requestId: para seguir la fase con getGenerationProgress mientras tarda. */
export function generateLocationRegions(worldId: number, additive = false, requestId?: string) {
  return request<LocationGraph>('/location/generate-regions', {
    method: 'POST',
    body: JSON.stringify({ world_id: worldId, additive }),
    requestId,
  })
}

export function expandLocationNode(worldId: number, nodeId: number) {
  return request<LocationGraph>('/location/expand-node', {
    method: 'POST',
    body: JSON.stringify({ world_id: worldId, node_id: nodeId }),
  })
}

export function enrichLocationNode(worldId: number, nodeId: number) {
  return request<LocationNode>('/location/enrich-node', {
    method: 'POST',
    body: JSON.stringify({ world_id: worldId, node_id: nodeId }),
  })
}

// --- Seed Templates ---

export interface SeedTemplateBrief {
  id: number
  title: string
  description: string
  category: string
  tags: string[]
  node_count: number
}

export function listSeedTemplates() {
  return request<SeedTemplateBrief[]>('/seeds')
}

export function createWorldFromSeed(seedId: number, name: string, premise: string) {
  return request<{ job_id: string }>('/seeds/create-world', {
    method: 'POST',
    body: JSON.stringify({ seed_id: seedId, name, premise }),
  })
}

// --- Character Profiles ---

export interface ProfileTemplateBrief {
  id: number
  title: string
  description: string
  tags: string[]
  node_count: number
}

export interface CharacterPremiseAnalysis {
  origen: string
  deseo: string
  conflicto: string
  stakes: string
}

export function getCharacterProfiles() {
  return request<ProfileTemplateBrief[]>('/character/profiles')
}

export function refineCharacterPremise(premise: string) {
  return request<{ analysis: CharacterPremiseAnalysis; premise: string }>('/character/refine-premise', {
    method: 'POST',
    body: JSON.stringify({ premise }),
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Character Node Catalog
// ────────────────────────────────────────────────────────────────────────────

export interface CatalogNode {
  id: number
  domain: CharacterNodeDomain
  label: string
  description: string
  salience: number
  sort_order: number
}

export interface ContextualCharacterNode {
  id: number
  world_id: number
  domain: CharacterNodeDomain
  label: string
  description: string
  salience: number
  source: 'manual' | 'ai_suggested'
}

export interface DomainSynthesis {
  character_id: number
  domain: CharacterNodeDomain
  synthesis: string
  is_stale: boolean
}

export function getCatalog(domain?: string) {
  const qs = domain ? `?domain=${domain}` : ''
  return request<CatalogNode[]>(`/character/catalog${qs}`)
}

export function getContextualNodes(worldId: number, domain?: string) {
  const qs = domain ? `&domain=${domain}` : ''
  return request<ContextualCharacterNode[]>(`/character/catalog/world?world_id=${worldId}${qs}`)
}

export function createContextualNode(data: {
  world_id: number
  domain: CharacterNodeDomain
  label: string
  description: string
  salience: number
}) {
  return request<ContextualCharacterNode>('/character/catalog/world/create', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateContextualNode(data: {
  id: number
  label: string
  description: string
  salience: number
}) {
  return request<{ ok: boolean }>('/character/catalog/world/update', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteContextualNode(id: number) {
  return request<{ ok: boolean }>(`/character/catalog/world/delete?id=${id}`, {
    method: 'DELETE',
  })
}

export function addNodeFromCatalog(characterId: number, catalogNodeId: number) {
  return request<CharacterNode>(`/character/node/add-from-catalog`, {
    method: 'POST',
    body: JSON.stringify({ character_id: characterId, catalog_node_id: catalogNodeId }),
  })
}

export function addNodeFromContextual(characterId: number, contextualNodeId: number) {
  return request<CharacterNode>(`/character/node/add-from-world-catalog`, {
    method: 'POST',
    body: JSON.stringify({ character_id: characterId, contextual_node_id: contextualNodeId }),
  })
}

export function synthesizeDomain(characterId: number, domain: string) {
  return request<DomainSynthesis>(`/character/domain/synthesize`, {
    method: 'POST',
    body: JSON.stringify({ character_id: characterId, domain }),
  })
}

export function getSynthesis(characterId: number) {
  return request<DomainSynthesis[]>(`/character/domain/synthesis?character_id=${characterId}`)
}

export interface CharacterSoul {
  instructions: string[]
  is_stale: boolean
  generated_at: string
}

export async function getCharacterSoul(characterId: number): Promise<CharacterSoul | null> {
  const res = await fetch(`${API_URL}/character/soul?character_id=${characterId}`, {
    headers: authHeaders(),
  })
  // 204: el personaje aún no tiene alma (404 en backends anteriores).
  if (res.status === 204 || res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch soul')
  return res.json()
}

export async function regenerateCharacterSoul(characterId: number): Promise<CharacterSoul> {
  const res = await fetch(`${API_URL}/character/soul/regenerate?character_id=${characterId}`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to regenerate soul')
  return res.json()
}

// --- Brainstorm ---

export interface BrainstormAxis {
  topic: string
  question: string
}

export interface BrainstormCard {
  category: string
  content: string
}

export function suggestBrainstormAxes(premise: string) {
  return request<{ axes: BrainstormAxis[] }>('/brainstorm/suggest-axes', {
    method: 'POST',
    body: JSON.stringify({ premise }),
  })
}

export function generateBrainstormCards(premise: string, topic: string, question: string) {
  return request<{ cards: BrainstormCard[] }>('/brainstorm/generate-cards', {
    method: 'POST',
    body: JSON.stringify({ premise, topic, question }),
  })
}

// --- Story ---

export interface NarratorConfig {
  pov: string
  style: string
  distance: string
  reliability: string
  focus?: number
}

export interface Story {
  id: number
  world_id: number
  title: string
  premise?: string
  narrator_default?: NarratorConfig
  status: string
}

export interface StoryBrief {
  id: number
  title: string
  status: string
}

export interface StoryCharacter {
  character_id: number
  name: string
}

export interface StoryRelationship {
  id: number
  story_id: number
  character_a_id: number
  character_b_id: number
  character_a_name?: string
  character_b_name?: string
  rel_type: string
  subtype: string
  description?: string
  directional: boolean
}

export interface StoryFact {
  id: number
  story_id: number
  content: string
  known_by: number[]
}

export interface StoryDetail {
  story: Story
  characters: StoryCharacter[]
  relationships: StoryRelationship[]
  facts: StoryFact[]
}

export function createStory(worldId: number, title: string, premise?: string) {
  return request<Story>('/story', {
    method: 'POST',
    body: JSON.stringify({ world_id: worldId, title, premise }),
  })
}

export function getStoryDetail(storyId: number) {
  return request<StoryDetail>(`/story/detail/${storyId}`)
}

export function updateStory(storyId: number, data: {
  title?: string
  premise?: string
  status?: string
  narrator_default?: NarratorConfig
}) {
  return request<void>(`/story/update/${storyId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function addStoryCharacter(storyId: number, characterId: number) {
  return request<void>(`/story/character/add/${storyId}`, {
    method: 'POST',
    body: JSON.stringify({ character_id: characterId }),
  })
}

export function removeStoryCharacter(storyId: number, characterId: number) {
  return request<void>(`/story/character/remove/${storyId}/${characterId}`, {
    method: 'DELETE',
  })
}

export function createRelationship(storyId: number, rel: {
  character_a_id: number
  character_b_id: number
  rel_type: string
  subtype: string
  description?: string
  directional: boolean
}) {
  return request<StoryRelationship>(`/story/relationship/create/${storyId}`, {
    method: 'POST',
    body: JSON.stringify(rel),
  })
}

export function updateRelationship(relId: number, rel: {
  rel_type: string
  subtype: string
  description?: string
  directional: boolean
}) {
  return request<void>(`/story/relationship/update/${relId}`, {
    method: 'PUT',
    body: JSON.stringify(rel),
  })
}

export function deleteRelationship(relId: number) {
  return request<void>(`/story/relationship/${relId}/delete`, {
    method: 'DELETE',
  })
}

export function createFact(storyId: number, content: string, knownBy: number[]) {
  return request<StoryFact>(`/story/fact/create/${storyId}`, {
    method: 'POST',
    body: JSON.stringify({ content, known_by: knownBy }),
  })
}

export function updateFact(factId: number, content: string, knownBy: number[]) {
  return request<void>(`/story/fact/update/${factId}`, {
    method: 'PUT',
    body: JSON.stringify({ content, known_by: knownBy }),
  })
}

export function deleteFact(factId: number) {
  return request<void>(`/story/fact/${factId}/delete`, {
    method: 'DELETE',
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Scene graph
// ────────────────────────────────────────────────────────────────────────────

export interface StoryScene {
  id: number
  story_id: number
  title: string
  location_node_id?: number
  location_name?: string
  narrator_config?: NarratorConfig
  vehicle: string
  status: string
  canvas_x: number
  canvas_y: number
}

export interface SceneEdge {
  id: number
  from_scene_id: number
  to_scene_id: number
  edge_type: string
  time_gap?: string
}

export interface SceneCharacter {
  scene_id: number
  character_id: number
  name?: string
}

export interface SceneBrief {
  id: number
  title: string
  status: string
  location_name?: string
  character_count: number
  character_ids: number[]
  is_opening: boolean
  canvas_x: number
  canvas_y: number
}

export interface StoryGraph {
  scenes: SceneBrief[]
  edges: SceneEdge[]
}

export function createScene(storyId: number, title: string, canvasX: number, canvasY: number) {
  return request<StoryScene>('/scene/create', {
    method: 'POST',
    body: JSON.stringify({ story_id: storyId, title, canvas_x: canvasX, canvas_y: canvasY }),
  })
}

export function getSceneDetail(id: number) {
  return request<StoryScene>(`/scene/detail/${id}`)
}

export function updateScene(id: number, data: { title?: string; status?: string; location_node_id?: number; vehicle?: string }) {
  return request<void>(`/scene/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateScenePosition(id: number, canvasX: number, canvasY: number) {
  return request<void>(`/scene/position/${id}`, {
    method: 'POST',
    body: JSON.stringify({ canvas_x: canvasX, canvas_y: canvasY }),
  })
}

export function deleteScene(id: number) {
  return request<void>(`/scene/delete/${id}`, {
    method: 'POST',
  })
}

export function setSceneOpening(id: number, isOpening: boolean) {
  return request<void>(`/scene/opening/${id}`, {
    method: 'POST',
    body: JSON.stringify({ is_opening: isOpening }),
  })
}

export function getStoryGraph(storyId: number) {
  return request<StoryGraph>(`/scene/graph/${storyId}`)
}

export interface ReadingScene {
  scene_id: number
  title: string
  version?: number
  prose: string
}

/** Scenes in reading order (graph edges), each with its current prose. */
export function readStory(storyId: number) {
  return request<ReadingScene[]>(`/story/read/${storyId}`)
}

export function createSceneEdge(fromSceneId: number, toSceneId: number, edgeType = 'causal') {
  return request<SceneEdge>('/scene/edge/create', {
    method: 'POST',
    body: JSON.stringify({ from_scene_id: fromSceneId, to_scene_id: toSceneId, edge_type: edgeType }),
  })
}

export function addSceneCharacter(sceneId: number, characterId: number) {
  return request<void>(`/scene/character/add/${sceneId}`, {
    method: 'POST',
    body: JSON.stringify({ character_id: characterId }),
  })
}

export function removeSceneCharacter(sceneId: number, characterId: number) {
  return request<void>(`/scene/character/remove/${sceneId}/${characterId}`, {
    method: 'POST',
  })
}

export function getSceneCharacters(sceneId: number) {
  return request<SceneCharacter[]>(`/scene/characters/${sceneId}`)
}

// --- Scenes v2 (Plan 3B-lite) ---

export type SceneNodeKind = 'character' | 'location' | 'moment' | 'narrator' | 'direction'
export type SceneEdgeKind = 'flow' | 'attachment'

export interface NarratorNodeConfig {
  pov: string
  style: string
  distance: string
  reliability: string
  focus_character_id?: number | null
}

export interface SceneNode {
  id: number
  scene_id: number
  node_kind: SceneNodeKind
  character_id?: number | null
  location_node_id?: number | null
  description?: string
  owner_kind?: string
  owner_character_id?: number | null
  hidden: boolean
  narrator_config?: NarratorNodeConfig | null
  /** Momentos: lo que es cierto después. El cómo ocurre lo decide el modelo. */
  outcomes?: string[]
  canvas_x: number
  canvas_y: number
  created_at: string
}

export interface SceneNodeEdge {
  id: number
  scene_id: number
  from_node_id: number
  to_node_id: number
  edge_kind: SceneEdgeKind
  created_at: string
}

export interface SceneDeltaJSON {
  facts?: string[]
  reveals?: string[]
  relationship_changes?: string[]
  emotional_shifts?: string[]
  marking_events?: string[]
  location_effects?: string[]
  unresolved?: string[]
  summary?: string
}

export interface SceneOutput {
  id: number
  scene_id: number
  version: number
  vehicle: string
  content: string
  delta_json?: SceneDeltaJSON | null
  correlation_id?: string
  created_at: string
  /** La versión vigente de la escena. */
  current?: boolean
}

export function createSceneNode(sceneId: number, node: Partial<SceneNode>): Promise<SceneNode> {
  return request<SceneNode>(`/scene/node/create/${sceneId}`, {
    method: 'POST',
    body: JSON.stringify(node),
  })
}

export function updateSceneNode(id: number, patch: Partial<SceneNode>): Promise<void> {
  return request<void>(`/scene/node/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(patch),
  })
}

export function updateSceneNodePosition(id: number, x: number, y: number): Promise<void> {
  return request<void>(`/scene/node/position/${id}`, {
    method: 'POST',
    body: JSON.stringify({ canvas_x: x, canvas_y: y }),
  })
}

export function deleteSceneNode(id: number): Promise<void> {
  return request<void>(`/scene/node/delete/${id}`, { method: 'POST' })
}

export function listSceneNodes(sceneId: number): Promise<SceneNode[]> {
  return request<SceneNode[]>(`/scene/node/list/${sceneId}`)
}

/** De dónde viene un personaje: su última aparición siguiendo los enlaces
 *  hacia atrás. Sin from_scene_id, sale por primera vez en la historia. */
export interface CharacterCarry {
  character_id: number
  name: string
  from_scene_id?: number
  from_scene_title?: string
  place?: string
  last_moment?: string
  outcomes?: string[]
  /** Lo que le quedó de apariciones anteriores (la mano perdida sigue perdida). */
  earlier?: string[]
}

/** Lo que una escena recibe de las anteriores; es lo mismo que recibe el escritor. */
export interface SceneCarry {
  characters: CharacterCarry[]
  /** La escena anterior, cuando ningún personaje de esta salía en ella. */
  before?: string
}

export function getSceneCarry(sceneId: number): Promise<SceneCarry> {
  return request<SceneCarry>(`/scene/carry/${sceneId}`)
}

export function createSceneNodeEdge(
  sceneId: number,
  fromId: number,
  toId: number,
  edgeKind: SceneEdgeKind = 'flow',
): Promise<SceneNodeEdge> {
  return request<SceneNodeEdge>(`/scene/edge2/create/${sceneId}`, {
    method: 'POST',
    body: JSON.stringify({ from_node_id: fromId, to_node_id: toId, edge_kind: edgeKind }),
  })
}

export function deleteSceneNodeEdge(id: number): Promise<void> {
  return request<void>(`/scene/edge2/delete/${id}`, { method: 'POST' })
}

export function listSceneNodeEdges(sceneId: number): Promise<SceneNodeEdge[]> {
  return request<SceneNodeEdge[]>(`/scene/edge2/list/${sceneId}`)
}

/** format: prose (novela, por defecto), audio, video o image. */
export function generateScene(
  sceneId: number,
  requestId?: string,
  format: string = 'prose',
): Promise<{ prose: string; delta: SceneDeltaJSON; version: number; unmet_outcomes?: string[] }> {
  const query = format === 'prose' ? '' : `?format=${encodeURIComponent(format)}`
  return request<{ prose: string; delta: SceneDeltaJSON; version: number; unmet_outcomes?: string[] }>(
    `/scene/generate/${sceneId}${query}`,
    { method: 'POST', requestId },
  )
}

// Plan de escritura: las reglas del escritor y la hoja de cada escena con
// momentos, en orden de lectura, para que escriba otro modelo o el autor.
export interface WritingPlanScene {
  scene_id: number
  title: string
  sheet: string
  outcomes?: string[]
}

export interface WritingPlan {
  rules: string
  scenes: WritingPlanScene[]
}

export function getWritingPlan(storyId: number): Promise<WritingPlan> {
  return request<WritingPlan>(`/story/plan/${storyId}`)
}

// Guarda una prosa escrita fuera como versión vigente; el juez local dice
// qué "después" no ve cumplidos. Puede tardar: una comprobación por salida.
export function saveSceneProse(
  sceneId: number,
  prose: string,
  requestId?: string,
): Promise<{ prose: string; version: number; unmet_outcomes?: string[] }> {
  return request<{ prose: string; version: number; unmet_outcomes?: string[] }>(
    `/scene/prose/${sceneId}`,
    { method: 'POST', body: JSON.stringify({ prose }), requestId },
  )
}

export function listSceneOutputs(sceneId: number): Promise<SceneOutput[]> {
  return request<SceneOutput[]>(`/scene/output/list/${sceneId}`)
}

export function revertSceneOutput(sceneId: number, version: number): Promise<void> {
  return request<void>(`/scene/output/revert/${sceneId}/${version}`, { method: 'POST' })
}
