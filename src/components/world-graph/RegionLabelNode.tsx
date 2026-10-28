import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'

export interface RegionLabelNodeData {
  text: string
  fontSize: number
}

/**
 * Place name drawn over the terrain.
 *
 * The regions have always carried names in the database and the canvas never
 * showed a single one, which left the map as a mosaic of coloured shapes: you
 * could see it but you could not read it. Labels are what turn it into a map.
 *
 * They are their own node type rather than SVG text inside `RegionNode` for one
 * reason: a node has a single z-index, so a label living inside its region
 * would be buried by any region stacked above it — which, with relief drawn
 * over cover and rivers over both, is most of them.
 */
export const RegionLabelNode = memo(function RegionLabelNode({ data }: NodeProps) {
  const d = data as unknown as RegionLabelNodeData

  return (
    <div
      style={{
        // The node is positioned at the region's centroid; recentre the text on
        // it rather than hanging it off the top-left corner.
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        fontFamily: "Georgia, 'Iowan Old Style', serif",
        fontStyle: 'italic',
        fontWeight: 500,
        fontSize: `${d.fontSize}px`,
        lineHeight: 1,
        color: '#241f17',
        letterSpacing: '0.02em',
        // Outline, not glow. A soft `0 0 Npx` shadow disappears against dark
        // forest and against pale desert alike; four hard 1px offsets plus one
        // soft pass give a real cartographic halo that works over any fill.
        textShadow: [
          '-1px -1px 0 #fdfbf4',
          '1px -1px 0 #fdfbf4',
          '-1px 1px 0 #fdfbf4',
          '1px 1px 0 #fdfbf4',
          '0 0 5px rgba(253,251,244,0.95)',
        ].join(', '),
      }}
    >
      {d.text}
    </div>
  )
})
