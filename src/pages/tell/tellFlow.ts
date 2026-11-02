import {
  createScene, createSceneEdge, createSceneNode, createSceneNodeEdge, createStory, createWorld, setSceneOpening,
} from '@/services/api'
import type { SceneBrief, Story, StoryGraph } from '@/services/api'
import { ApiError } from '@/services/telemetry'

/**
 * Contar primero (2026-11-03, docs/superpowers/specs/2026-11-02-contar-primero-
 * design.md): lo que pasa por debajo de «una frase y qué pasa». Mundo e
 * historia provisionales si faltan, y una escena sin reparto ni lugar con el
 * «qué pasa» partido por frases en momentos. Mismas reglas que st_tell en el
 * MCP (storyteller-mcp/src/tools.js), que es por donde se mide.
 */

const SENTENCE_END = /(?<=[.;?!])\s+/

/** Parte por frases en hasta cuatro momentos; las sobrantes se pegan al cuarto. Nunca cero. */
export function splitMoments(text: string, max = 4): string[] {
  const parts = text.trim().split(SENTENCE_END).map(s => s.trim()).filter(Boolean)
  if (parts.length === 0) return [text.trim()]
  if (parts.length <= max) return parts
  return [...parts.slice(0, max - 1), parts.slice(max - 1).join(' ')]
}

/** Las n primeras palabras, sin signos: nombre provisional de mundo o historia. */
export function provisionalName(text: string, n = 4): string {
  const words = text.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').split(/\s+/).filter(Boolean)
  return words.slice(0, n).join(' ') || 'Sin título'
}

/** La primera frase: premisa provisional cuando «¿De qué va?» va vacío. */
export function firstSentence(text: string): string {
  return text.trim().split(SENTENCE_END)[0]?.trim() ?? ''
}

const isConflict = (err: unknown) => err instanceof ApiError && err.status === 409

/** Crea con un nombre y, si el backend dice 409 (repetido), prueba « (2)», « (3)»… hasta cinco. */
async function withSuffix<T>(base: string, create: (name: string) => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let i = 1; i <= 5; i++) {
    const name = i === 1 ? base : `${base} (${i})`
    try {
      return await create(name)
    } catch (err) {
      if (!isConflict(err)) throw err
      lastErr = err
    }
  }
  throw lastErr
}

/** El mundo provisional: la premisa (o la primera frase del qué pasa) y un nombre de cuatro palabras. */
export async function ensureWorld(premise: string, whatHappens: string): Promise<number> {
  const storyPremise = premise.trim() || firstSentence(whatHappens)
  const created = await withSuffix(provisionalName(premise.trim() || whatHappens), name =>
    createWorld({ name, premise: storyPremise, description: '', rule: '', scarcity: '', power: '' }))
  return created.id
}

/** La historia provisional: seis palabras del qué pasa como título. */
export function ensureStory(worldId: number, whatHappens: string, premise: string): Promise<Story> {
  const storyPremise = premise.trim() || firstSentence(whatHappens)
  return withSuffix(provisionalName(whatHappens, 6), title => createStory(worldId, title, storyPremise))
}

/**
 * La escena del camino básico: sin reparto ni lugar, los momentos del «qué
 * pasa» encadenados por aristas de flujo; apertura si es la primera, o
 * enlazada tras la anterior. `index` la coloca debajo en el lienzo.
 */
export async function createTellScene(storyId: number, whatHappens: string, afterSceneId: number | undefined, index: number): Promise<number> {
  const scene = await createScene(storyId, provisionalName(whatHappens, 6), 0, 160 * index)
  if (afterSceneId) await createSceneEdge(afterSceneId, scene.id)
  else await setSceneOpening(scene.id, true)
  const ids: number[] = []
  for (const [i, description] of splitMoments(whatHappens).entries()) {
    const node = await createSceneNode(scene.id, { node_kind: 'moment', description, outcomes: [], canvas_x: 0, canvas_y: i * 140 })
    ids.push(node.id)
  }
  for (let i = 1; i < ids.length; i++) await createSceneNodeEdge(scene.id, ids[i - 1], ids[i], 'flow')
  return scene.id
}

/** Escenas en orden de lectura: desde la apertura por las aristas; luego las cabezas sueltas; luego el resto. */
export function orderScenes(graph: StoryGraph): SceneBrief[] {
  const byId = new Map(graph.scenes.map(s => [s.id, s]))
  const next = new Map<number, number[]>()
  for (const e of graph.edges) {
    if (!next.has(e.from_scene_id)) next.set(e.from_scene_id, [])
    next.get(e.from_scene_id)!.push(e.to_scene_id)
  }
  const ordered: SceneBrief[] = []
  const seen = new Set<number>()
  const walk = (id: number) => {
    for (const t of next.get(id) ?? []) {
      if (seen.has(t) || !byId.has(t)) continue
      seen.add(t)
      ordered.push(byId.get(t)!)
      walk(t)
    }
  }
  const hasIncoming = new Set(graph.edges.map(e => e.to_scene_id))
  const heads = [...graph.scenes]
    .filter(s => s.is_opening || !hasIncoming.has(s.id))
    .sort((a, b) => Number(b.is_opening) - Number(a.is_opening) || a.canvas_y - b.canvas_y)
  for (const h of heads) {
    if (seen.has(h.id)) continue
    seen.add(h.id)
    ordered.push(h)
    walk(h.id)
  }
  for (const s of [...graph.scenes].sort((a, b) => a.canvas_y - b.canvas_y)) if (!seen.has(s.id)) ordered.push(s)
  return ordered
}
