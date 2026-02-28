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

// --- Worlds ---

export interface World {
  id: number
  name: string
  era: string
  climate: string
  politics: string
  culture: string
  factions: string[]
  description: string
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

export function generateWorld(description: string) {
  return request<World>('/world/generate', {
    method: 'POST',
    body: JSON.stringify({ description }),
  })
}

export function deleteWorld(id: number) {
  return request<{ status: string }>(`/world/delete?id=${id}`, {
    method: 'DELETE',
  })
}

// --- World Detail ---

export interface Character {
  id: number
  name: string
  role: string
  personality: string
  background: string
  goals: string[]
  world_id: number
  state: Record<string, string>
}

export interface Scene {
  id: number
  title: string
  location: string
  time: string
  tone: string
  context: string
  world_id: number
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

// --- Narrative ---

export interface SceneNarrative {
  text: string
}

export function getSceneNarrative(sceneId: number) {
  return request<SceneNarrative>(`/scene/narrative/get?id=${sceneId}`)
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
