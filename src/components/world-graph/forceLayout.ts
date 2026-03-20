import * as d3 from 'd3-force'
import type { Node } from '@xyflow/react'

export type ConceptNodeData = {
  label: string
  domain: 'physical' | 'biological' | 'social' | 'core'
  description?: string
  isGhost?: boolean
  [key: string]: unknown
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string
}

export function applyForceLayout(
  nodes: Node<ConceptNodeData>[],
  edges: { source: string; target: string }[],
  width = 800,
  height = 600,
): Node<ConceptNodeData>[] {
  if (nodes.length === 0) return nodes

  const simNodes: SimNode[] = nodes.map(n => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
  }))

  const simLinks = edges.map(e => ({ source: e.source, target: e.target }))

  const simulation = d3
    .forceSimulation(simNodes)
    .force('link', d3.forceLink(simLinks).id((d: d3.SimulationNodeDatum) => (d as SimNode).id).distance(160).strength(0.5))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide(80))
    .stop()

  // Run synchronously
  for (let i = 0; i < 300; i++) simulation.tick()

  const posMap = new Map(simNodes.map(n => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]))

  return nodes.map(n => ({
    ...n,
    position: posMap.get(n.id) ?? n.position,
  }))
}
