import {
  getWorldById,
  createWorld,
  createCharacter,
} from './api'
import type { World, Character } from './api'

// ── Export Schema ──

export interface StoryTellerExport {
  storyteller_export: {
    version: '1.0'
    exported_at: string
    world: {
      name: string
      description: string
      premise: string
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
      faction_affiliation?: string
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
  const worldData = await getWorldById(worldId)

  if (!worldData || !worldData.name) {
    throw new Error('World not found')
  }

  const world: World = worldData

  // getWorldById may return extra fields from the backend
  const raw = worldData as unknown as Record<string, unknown>
  const characters: Character[] = Array.isArray(raw.characters)
    ? (raw.characters as Character[])
    : []

  // Build export object
  const exportData: StoryTellerExport = {
    storyteller_export: {
      version: '1.0',
      exported_at: new Date().toISOString(),
      world: {
        name: world.name,
        description: world.description,
        premise: world.premise,
      },
      characters: characters.map((c) => ({
        name: c.name,
        role: (c as unknown as Record<string, string>).role ?? '',
        personality: (c as unknown as Record<string, string>).personality ?? '',
        background: (c as unknown as Record<string, string>).background ?? '',
        goals: (c as unknown as Record<string, string[]>).goals ?? [],
        ...(c.premise && { premise: c.premise }),
        ...((c as unknown as Record<string, string>).social_position && { social_position: (c as unknown as Record<string, string>).social_position }),
        ...((c as unknown as Record<string, string>).internal_contradiction && { internal_contradiction: (c as unknown as Record<string, string>).internal_contradiction }),
        ...((c as unknown as Record<string, string>).faction_affiliation && { faction_affiliation: (c as unknown as Record<string, string>).faction_affiliation }),
      })),
    },
  }

  downloadJson(exportData, `${world.name}-storyteller.json`)
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
    const { world, characters } = data.storyteller_export

    // 1. Create world
    const createdWorld = await createWorld(
      world.name,
      world.premise ?? '',
      world.description ?? '',
    )

    const worldId = createdWorld.id

    // 2. Create characters
    if (characters && characters.length > 0) {
      await Promise.all(
        characters.map((c) =>
          createCharacter({
            name: c.name,
            world_id: worldId,
            ...(c.premise && { premise: c.premise }),
          }),
        ),
      )
    }

    return { success: true, worldId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
