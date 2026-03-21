import type { WorldNode } from '@/services/api'

export interface TreePosition {
  id: number
  x: number
  y: number
}

const NODE_WIDTH = 180
const NODE_HEIGHT = 60
const H_GAP = 40   // horizontal gap between siblings
const V_GAP = 100  // vertical gap between levels

/**
 * Computes top-down tree positions for a flat list of WorldNodes.
 * Returns a map of node ID → {x, y} in React Flow coordinate space.
 */
export function computeTreeLayout(nodes: WorldNode[]): Map<number, TreePosition> {
  if (nodes.length === 0) return new Map()

  // Build parent → children index
  const children = new Map<number | null, WorldNode[]>()
  for (const n of nodes) {
    const parentKey = n.parent_id ?? null
    if (!children.has(parentKey)) children.set(parentKey, [])
    children.get(parentKey)!.push(n)
  }

  // Sort children by position_order
  for (const list of children.values()) {
    list.sort((a, b) => a.position_order - b.position_order)
  }

  // Compute subtree width for each node (used for centering)
  const subtreeWidth = new Map<number, number>()
  function measureWidth(nodeId: number): number {
    const kids = children.get(nodeId) ?? []
    if (kids.length === 0) {
      subtreeWidth.set(nodeId, NODE_WIDTH)
      return NODE_WIDTH
    }
    let total = 0
    for (let i = 0; i < kids.length; i++) {
      total += measureWidth(kids[i].id)
      if (i < kids.length - 1) total += H_GAP
    }
    subtreeWidth.set(nodeId, total)
    return total
  }

  const rootNodes = children.get(null) ?? []
  for (const root of rootNodes) measureWidth(root.id)

  // Place nodes top-down
  const positions = new Map<number, TreePosition>()

  function placeNode(nodeId: number, x: number, y: number): void {
    positions.set(nodeId, { id: nodeId, x, y })
    const kids = children.get(nodeId) ?? []
    if (kids.length === 0) return
    const totalWidth = kids.reduce((sum, k, i) =>
      sum + subtreeWidth.get(k.id)! + (i < kids.length - 1 ? H_GAP : 0), 0)
    let curX = x - totalWidth / 2
    for (const kid of kids) {
      const kw = subtreeWidth.get(kid.id)!
      placeNode(kid.id, curX + kw / 2, y + NODE_HEIGHT + V_GAP)
      curX += kw + H_GAP
    }
  }

  // Place root nodes side by side
  let rootX = 0
  for (const root of rootNodes) {
    placeNode(root.id, rootX + subtreeWidth.get(root.id)! / 2, 0)
    rootX += subtreeWidth.get(root.id)! + H_GAP
  }

  return positions
}

export const DOMAIN_COLOR: Record<string, string> = {
  core:       '#a855f7', // purple
  physical:   '#10b981', // emerald
  biological: '#f59e0b', // amber
  social:     '#0ea5e9', // sky
  symbolic:   '#ec4899', // pink
  technic:    '#6366f1', // indigo
}

export const DOMAIN_LABEL: Record<string, string> = {
  core:       'Núcleo',
  physical:   'Físico',
  biological: 'Biológico',
  social:     'Social',
  symbolic:   'Simbólico',
  technic:    'Técnico',
}

export const ROLE_LABEL: Record<string, string> = {
  state:   'Estado',
  event:   'Evento',
  rupture: 'Ruptura',
}

export const EDGE_LABEL: Record<string, string> = {
  requires:     'requiere',
  produces:     'produce',
  enables:      'permite',
  undermines:   'socava',
  gives_rise_to: 'da lugar a',
}
