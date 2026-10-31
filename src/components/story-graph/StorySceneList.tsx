import { useMemo } from 'react'
import type { Edge, Node } from '@xyflow/react'
import { BookOpen, MoreHorizontal, PenLine } from 'lucide-react'
import type { InicioNodeData } from './InicioNode'
import type { SceneNodeData } from './SceneNode'

// El grafo de la historia en el móvil (2026-10-31): el lienzo no se dibuja,
// se recorre. La historia como el índice de un libro: portada con el título y
// el reparto, y las escenas como entradas numeradas unidas por un hilo
// vertical en orden de lectura, continuo donde ya hay prosa y punteado donde
// no. El hilo es el eco del grafo que el móvil no dibuja. Tocar una entrada
// entra en la escena; «···» abre su detalle.

type AnyNode = Node<InicioNodeData> | Node<SceneNodeData>

interface Props {
  storyTitle: string
  castNames: string[]
  nodes: AnyNode[]
  edges: Edge[]
  loading: boolean
  copyingPlan: boolean
  onOpenInicio: () => void
  onEnterScene: (sceneId: number) => void
  onSceneDetail: (sceneId: number) => void
  onRead: () => void
  onCopyPlan: () => void
  onCreateScene: () => void
}

/** Escenas en orden de lectura (cadena desde Inicio) y, aparte, las sueltas. */
function readingOrder(nodes: AnyNode[], edges: Edge[]): { ordered: Node<SceneNodeData>[]; loose: Node<SceneNodeData>[] } {
  const scenes = nodes.filter((n): n is Node<SceneNodeData> => n.id.startsWith('scene-'))
  const byId = new Map(scenes.map(n => [n.id, n]))
  const next = new Map<string, string[]>()
  for (const e of edges) {
    if (!next.has(e.source)) next.set(e.source, [])
    next.get(e.source)!.push(e.target)
  }
  const ordered: Node<SceneNodeData>[] = []
  const seen = new Set<string>()
  const walk = (id: string) => {
    for (const t of next.get(id) ?? []) {
      if (seen.has(t) || !byId.has(t)) continue
      seen.add(t)
      ordered.push(byId.get(t)!)
      walk(t)
    }
  }
  walk('inicio')
  // Cadenas que no arrancan en Inicio: desde sus cabezas, en orden del lienzo.
  const hasIncoming = new Set(edges.map(e => e.target))
  const heads = scenes.filter(n => !seen.has(n.id) && !hasIncoming.has(n.id)).sort((a, b) => a.position.y - b.position.y)
  for (const h of heads) {
    if (seen.has(h.id)) continue
    seen.add(h.id)
    ordered.push(h)
    walk(h.id)
  }
  const loose = scenes.filter(n => !seen.has(n.id)).sort((a, b) => a.position.y - b.position.y)
  return { ordered, loose }
}

const ROMAN: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
function roman(n: number): string {
  let out = ''
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v }
  return out
}

/** El título sin el «3. » que algunos llevan delante: el índice ya numera. */
const bareTitle = (t: string) => t.replace(/^\s*\d+\s*[.·)-]\s*/, '')

const STATUS_WORD: Record<string, string> = { generated: 'escrita', stale: 'desactualizada' }

export function StorySceneList({
  storyTitle, castNames, nodes, edges, loading, copyingPlan,
  onOpenInicio, onEnterScene, onSceneDetail, onRead, onCopyPlan, onCreateScene,
}: Props) {
  const { ordered, loose } = useMemo(() => readingOrder(nodes, edges), [nodes, edges])

  const entry = (node: Node<SceneNodeData>, index: number, threaded: boolean) => {
    const sceneId = Number(node.id.replace('scene-', ''))
    const written = node.data.status === 'generated' || node.data.status === 'stale'
    const meta = [node.data.locationName, STATUS_WORD[node.data.status] ?? 'borrador'].filter(Boolean).join(' · ')
    return (
      <li key={node.id} className="relative flex items-stretch">
        {threaded && (
          <>
            <span
              aria-hidden
              className={`absolute left-[13px] top-0 bottom-0 border-l ${written ? 'border-entity-scene' : 'border-dotted border-entity-scene-muted'}`}
            />
            <span
              aria-hidden
              className={`absolute left-[9px] top-[22px] size-[9px] rounded-full border border-entity-scene ${written ? 'bg-entity-scene' : 'bg-background'}`}
            />
          </>
        )}
        <button
          type="button"
          onClick={() => onEnterScene(sceneId)}
          className="flex-1 min-w-0 text-left pl-9 pr-2 py-3 active:bg-entity-scene-light/60"
        >
          <span className="flex items-baseline gap-3">
            {threaded && <span className="font-display italic text-entity-scene-muted text-base w-7 shrink-0 text-right">{roman(index)}</span>}
            <span className="font-display text-[1.15rem] leading-snug text-foreground">{bareTitle(node.data.title)}</span>
          </span>
          {meta && <span className="block pl-10 mt-0.5 text-xs text-muted-foreground">{meta}</span>}
        </button>
        <button
          type="button"
          onClick={() => onSceneDetail(sceneId)}
          className="shrink-0 w-11 flex items-center justify-center text-muted-foreground/60 active:text-foreground"
          aria-label={`Detalle de ${bareTitle(node.data.title)}`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </li>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 min-h-0 overflow-y-auto pb-28">
        {/* Portada */}
        <button type="button" onClick={onOpenInicio} className="block w-full text-left px-5 pt-7 pb-5 active:bg-entity-scene-light/40">
          <p className="text-[10px] tracking-[0.25em] uppercase text-entity-scene-muted" style={{ fontFamily: 'var(--font-ui)' }}>Historia</p>
          <h2 className="font-display text-[2rem] leading-[1.05] text-foreground mt-1" style={{ textWrap: 'balance' }}>{storyTitle}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {castNames.length > 0 ? castNames.join(' · ') : 'Sin reparto aún · toca para elegirlo'}
          </p>
        </button>
        <div className="mx-5 border-t border-border/70" />

        {loading && ordered.length === 0 && <p className="px-5 py-5 text-sm text-muted-foreground">Cargando…</p>}
        {!loading && ordered.length === 0 && loose.length === 0 && (
          <p className="px-5 py-8 text-sm text-muted-foreground font-display italic">
            Aún no hay escenas. La primera abre la historia.
          </p>
        )}

        <ol className="mt-2">
          {ordered.map((node, i) => entry(node, i + 1, true))}
        </ol>

        {loose.length > 0 && (
          <>
            <p className="px-5 pt-6 pb-1 text-[10px] tracking-[0.25em] uppercase text-muted-foreground" style={{ fontFamily: 'var(--font-ui)' }}>Sin orden</p>
            <ol>{loose.map((node, i) => entry(node, i + 1, false))}</ol>
          </>
        )}

        <button
          type="button"
          onClick={onCopyPlan}
          disabled={copyingPlan}
          className="mt-6 mx-5 min-h-11 text-sm text-muted-foreground underline underline-offset-4 decoration-border disabled:opacity-60"
        >
          {copyingPlan ? 'Preparando el plan…' : 'Copiar el plan de escritura'}
        </button>
      </div>

      {/* Acciones, fijas abajo: la pluma y el libro. */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border/70 bg-background/95 backdrop-blur-[2px] pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={onCreateScene}
          className="flex-1 min-h-14 inline-flex items-center justify-center gap-2 font-medium text-entity-scene active:bg-entity-scene-light/60"
        >
          <PenLine className="w-4 h-4" />
          Nueva escena
        </button>
        <span className="w-px bg-border/70 my-3" />
        <button
          type="button"
          onClick={onRead}
          className="flex-1 min-h-14 inline-flex items-center justify-center gap-2 font-medium text-foreground active:bg-accent"
        >
          <BookOpen className="w-4 h-4" />
          Leer historia
        </button>
      </div>
    </div>
  )
}
