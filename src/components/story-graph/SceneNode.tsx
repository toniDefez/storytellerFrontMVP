import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

export interface SceneNodeData extends Record<string, unknown> {
  title: string
  status: string
  locationName?: string
  characterCount: number
  characterNames: string[] // first 3 names for avatars
}

function statusBorderClass(status: string): string {
  switch (status) {
    case 'generated':
      return 'border-l-emerald-500'
    case 'stale':
      return 'border-l-rose-400'
    default:
      return 'border-l-amber-400'
  }
}

export function SceneNode({ data }: NodeProps<Node<SceneNodeData>>) {
  const { title, status, locationName, characterNames } = data
  const avatars = characterNames.slice(0, 3)
  const extra = (data.characterCount ?? 0) - avatars.length

  return (
    <>
      {/* Target handle — top */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !rounded-full !bg-cyan-400 !border-2 !border-cyan-500 !shadow-sm"
        style={{ top: -5 }}
      />
      {/* Target handle — left */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !rounded-full !bg-cyan-400 !border-2 !border-cyan-500 !shadow-sm"
        style={{ left: -5 }}
      />

      <div
        className={[
          'bg-white border border-stone-200 rounded-lg shadow-sm',
          'border-l-4',
          statusBorderClass(status),
          'hover:shadow-md hover:border-stone-300',
          'transition-all duration-150 cursor-pointer select-none px-3 py-2',
        ].join(' ')}
        style={{ minWidth: 200, maxWidth: 220 }}
      >
        {/* Title */}
        <p
          className="text-sm font-semibold text-stone-800 line-clamp-1"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </p>

        {/* Location */}
        <p
          className="text-xs text-muted-foreground mt-0.5 line-clamp-1"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {locationName || <span className="italic">Sin locación</span>}
        </p>

        {/* Character avatars */}
        {avatars.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {avatars.map((name, i) => (
              <span
                key={i}
                className="w-5 h-5 rounded-full bg-orange-100 border border-orange-300 text-[9px] text-orange-600 flex items-center justify-center font-medium uppercase"
                title={name}
              >
                {name.charAt(0)}
              </span>
            ))}
            {extra > 0 && (
              <span className="text-[9px] text-muted-foreground ml-0.5">+{extra}</span>
            )}
          </div>
        )}
      </div>

      {/* Source handle — right */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !rounded-full !bg-cyan-400 !border-2 !border-cyan-500 !shadow-sm"
        style={{ right: -5 }}
      />
      {/* Source handle — bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !rounded-full !bg-cyan-400 !border-2 !border-cyan-500 !shadow-sm"
        style={{ bottom: -5 }}
      />
    </>
  )
}
