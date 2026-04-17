import { FlowNodeCard } from './FlowNodeCard'
import type { FlowNode, FlowNodeType, SceneCharacter } from '@/services/api'

interface Props {
  nodes: FlowNode[]
  sceneCharacters: SceneCharacter[]
  onUpdate: (id: number, nodeType: FlowNodeType, config: Record<string, unknown>) => void
  onDelete: (id: number) => void
  onReorder: (orderedIds: number[]) => void
}

export function FlowNodeList({ nodes, sceneCharacters, onUpdate, onDelete }: Props) {
  const sorted = [...nodes].sort((a, b) => a.position - b.position)

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-stone-400 italic text-center px-4">
          Añade nodos desde la paleta para componer la escena
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {sorted.map((node, idx) => (
        <div key={node.id}>
          <FlowNodeCard
            node={node}
            sceneCharacters={sceneCharacters}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
          {idx < sorted.length - 1 && (
            <div className="border-l-2 border-dashed border-stone-200 h-4 ml-6" />
          )}
        </div>
      ))}
    </div>
  )
}
