import {
  getWorldDetail,
  getSceneDetail,
  createWorld,
  createCharacter,
  createScene,
  createEvent,
} from './api'
import type { World, Character, Scene, Event } from './api'

// ── Export Schema ──

export interface StoryTellerExport {
  storyteller_export: {
    version: '1.0'
    exported_at: string
    world: {
      name: string
      factions: string[]
      description: string
      core_axis: string
      environment: string
      subsistence: string
      organization: string
      tensions: string
      tone: string
    }
    characters: Array<{
      name: string
      role: string
      personality: string
      background: string
      goals: string[]
      premise?: string
      social_position?: string
      internal_contradiction?: string
      relation_to_collective_lie?: string
      personal_fear?: string
      faction_affiliation?: string
    }>
    scenes: Array<{
      title: string
      location: string
      time: string
      tone: string
      context: string
      events: Array<{
        description: string
      }>
    }>
  }
}

// ── Validation ──

export function validateExportFile(data: unknown): data is StoryTellerExport {
  if (!data || typeof data !== 'object') return false
  const root = data as Record<string, unknown>
  if (!root.storyteller_export || typeof root.storyteller_export !== 'object') return false
  const exp = root.storyteller_export as Record<string, unknown>
  if (!exp.version || !exp.world) return false
  return true
}

export function validateExportVersion(data: StoryTellerExport): boolean {
  return data.storyteller_export.version === '1.0'
}

// ── Export ──

export async function exportWorld(worldId: number): Promise<void> {
  // Fetch world detail — returns a flat object, needs normalization
  const rawData = await getWorldDetail(worldId)
  const raw = rawData as unknown as Record<string, unknown>

  if (!raw || !raw.name) {
    throw new Error('World not found')
  }

  // Normalize world (same logic as WorldDetailPage)
  const normalizedWorld: World = {
    id: Number(raw.id ?? worldId),
    name: String(raw.name ?? ''),
    factions: Array.isArray(raw.factions) ? (raw.factions as string[]) : [],
    description: String(raw.summary ?? raw.description ?? ''),
    core_axis: String(raw.core_axis ?? ''),
    environment: String(raw.environment ?? ''),
    subsistence: String(raw.subsistence ?? ''),
    organization: String(raw.organization ?? ''),
    tensions: String(raw.tensions ?? ''),
    tone: String(raw.tone ?? ''),
  }

  const characters: Character[] = Array.isArray(raw.characters)
    ? (raw.characters as Character[])
    : []
  const scenes: Scene[] = Array.isArray(raw.scenes)
    ? (raw.scenes as Scene[])
    : []

  // Fetch events for each scene
  const scenesWithEvents: Array<{
    scene: Scene
    events: Event[]
  }> = await Promise.all(
    scenes.map(async (scene) => {
      try {
        const detail = await getSceneDetail(scene.id)
        return {
          scene,
          events: Array.isArray(detail.events) ? detail.events : [],
        }
      } catch {
        return { scene, events: [] }
      }
    }),
  )

  // Build export object
  const exportData: StoryTellerExport = {
    storyteller_export: {
      version: '1.0',
      exported_at: new Date().toISOString(),
      world: {
        name: normalizedWorld.name,
        factions: normalizedWorld.factions,
        description: normalizedWorld.description,
        core_axis: normalizedWorld.core_axis,
        environment: normalizedWorld.environment,
        subsistence: normalizedWorld.subsistence,
        organization: normalizedWorld.organization,
        tensions: normalizedWorld.tensions,
        tone: normalizedWorld.tone,
      },
      characters: characters.map((c) => ({
        name: c.name,
        role: c.role,
        personality: c.personality,
        background: c.background,
        goals: c.goals ?? [],
        ...(c.premise && { premise: c.premise }),
        ...(c.social_position && { social_position: c.social_position }),
        ...(c.internal_contradiction && { internal_contradiction: c.internal_contradiction }),
        ...(c.relation_to_collective_lie && { relation_to_collective_lie: c.relation_to_collective_lie }),
        ...(c.personal_fear && { personal_fear: c.personal_fear }),
        ...(c.faction_affiliation && { faction_affiliation: c.faction_affiliation }),
      })),
      scenes: scenesWithEvents.map(({ scene, events }) => ({
        title: scene.title,
        location: scene.location,
        time: scene.time,
        tone: scene.tone,
        context: scene.context,
        events: events.map((e) => ({
          description: e.action,
        })),
      })),
    },
  }

  downloadJson(exportData, `${normalizedWorld.name}-storyteller.json`)
}

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Import ──

export interface ImportResult {
  success: boolean
  worldId?: number
  error?: string
}

export async function importWorld(data: StoryTellerExport): Promise<ImportResult> {
  try {
    const { world, characters, scenes } = data.storyteller_export

    // 1. Create world
    const createdWorld = await createWorld({
      name: world.name,
      factions: world.factions ?? [],
      description: world.description ?? '',
      core_axis: world.core_axis ?? '',
      environment: world.environment ?? '',
      subsistence: world.subsistence ?? '',
      organization: world.organization ?? '',
      tensions: world.tensions ?? '',
      tone: world.tone ?? '',
    })

    const worldId = createdWorld.id

    // 2. Create characters
    if (characters && characters.length > 0) {
      await Promise.all(
        characters.map((c) =>
          createCharacter({
            name: c.name,
            role: c.role,
            personality: c.personality,
            background: c.background,
            goals: c.goals ?? [],
            world_id: worldId,
            state: {},
            ...(c.premise && { premise: c.premise }),
            ...(c.social_position && { social_position: c.social_position }),
            ...(c.internal_contradiction && { internal_contradiction: c.internal_contradiction }),
            ...(c.relation_to_collective_lie && { relation_to_collective_lie: c.relation_to_collective_lie }),
            ...(c.personal_fear && { personal_fear: c.personal_fear }),
            ...(c.faction_affiliation && { faction_affiliation: c.faction_affiliation }),
          }),
        ),
      )
    }

    // 3. Create scenes and their events
    if (scenes && scenes.length > 0) {
      for (const scene of scenes) {
        const createdScene = await createScene({
          title: scene.title,
          location: scene.location,
          time: scene.time,
          tone: scene.tone,
          context: scene.context,
          world_id: worldId,
        })

        // 4. Create events for this scene
        if (scene.events && scene.events.length > 0) {
          for (let i = 0; i < scene.events.length; i++) {
            await createEvent({
              scene_id: createdScene.id,
              character_ids: [],
              action: scene.events[i].description,
              spot: '',
              position: i + 1,
            })
          }
        }
      }
    }

    return { success: true, worldId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
