import type { WritingPlan } from '@/services/api'

// El plan como texto para pegar en otro modelo (Claude, ChatGPT…): las reglas
// del escritor y la hoja de cada escena. Con sceneId, solo esa escena.
export function writingPlanMarkdown(plan: WritingPlan, sceneId?: number): string {
  const scenes = sceneId == null ? plan.scenes : plan.scenes.filter(s => s.scene_id === sceneId)
  const parts = [`# Plan de escritura\n\n## Reglas\n\n${plan.rules}`]
  for (const s of scenes) {
    parts.push(`## Escena: ${s.title}\n\n${s.sheet}`)
  }
  return parts.join('\n\n') + '\n'
}

/** Copia el texto; si el navegador no deja, lo descarga como fichero. */
export async function copyOrDownload(text: string, filename: string): Promise<'copied' | 'downloaded'> {
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return 'downloaded'
  }
}
