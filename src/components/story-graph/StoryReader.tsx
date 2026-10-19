import { useEffect, useState } from 'react'
import { readStory, type ReadingScene } from '@/services/api'
import { proseParagraphs } from '@/lib/prose'

interface Props {
  storyId: number
  title: string
  onBack: () => void
}

/**
 * The story as a reader sees it: every scene in graph order, current version,
 * one continuous page. Scenes not generated yet stay visible as a gap so the
 * author knows what is missing.
 */
export function StoryReader({ storyId, title, onBack }: Props) {
  const [scenes, setScenes] = useState<ReadingScene[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    readStory(storyId)
      .then(s => { if (!cancelled) setScenes(s) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar la historia.') })
    return () => { cancelled = true }
  }, [storyId])

  const words = (scenes ?? []).reduce((n, s) => n + (s.prose ? s.prose.trim().split(/\s+/).length : 0), 0)
  const pending = (scenes ?? []).filter(s => !s.prose).length

  return (
    <div className="h-full w-full overflow-y-auto bg-[hsl(40_30%_98%)]">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-[hsl(40_30%_98%)]/95 backdrop-blur border-b border-stone-200">
        <button
          onClick={onBack}
          className="bg-white border border-stone-200 rounded-lg shadow-sm px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver al grafo
        </button>
        {scenes && (
          <span className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-ui)' }}>
            {scenes.length} escenas · {words} palabras{pending > 0 ? ` · ${pending} sin generar` : ''}
          </span>
        )}
      </div>

      <article className="mx-auto max-w-[68ch] px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl mb-10 text-stone-900" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h1>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {!scenes && !error && <p className="text-sm text-muted-foreground">Cargando la historia…</p>}
        {scenes?.length === 0 && (
          <p className="text-sm text-muted-foreground">Esta historia aún no tiene escenas.</p>
        )}

        {scenes?.map((s, i) => (
          <section key={s.scene_id} className="mb-12">
            <h2 className="text-xs uppercase tracking-[0.18em] text-stone-500 mb-4" style={{ fontFamily: 'var(--font-ui)' }}>
              {toRoman(i + 1)} · {s.title}
            </h2>
            {s.prose ? (
              proseParagraphs(s.prose).map((p, j) => (
                <p key={j} className="mb-5 text-[1.125rem] leading-[1.75] text-stone-800" style={{ fontFamily: 'var(--font-display)' }}>
                  {p}
                </p>
              ))
            ) : (
              <p className="italic text-sm text-muted-foreground border-l-2 border-stone-300 pl-3">
                Esta escena aún no se ha generado.
              </p>
            )}
          </section>
        ))}
      </article>
    </div>
  )
}

function toRoman(n: number): string {
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [v, s] of map) while (n >= v) { out += s; n -= v }
  return out
}
