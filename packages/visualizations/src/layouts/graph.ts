import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import type { GraphNode, GraphEdge } from '../types'

/**
 * Graph node layout calculation result.
 */
export interface GraphNodeLayout extends GraphNode {
  /** X position */
  x: number
  /** Y position */
  y: number
  /** Fixed position flag */
  fx?: number | null
  /** Fixed position flag */
  fy?: number | null
}

/**
 * Graph edge layout calculation result.
 */
export interface GraphEdgeLayout {
  /** Source node */
  source: GraphNodeLayout
  /** Target node */
  target: GraphNodeLayout
  /** Edge weight */
  weight?: number
}

/**
 * Options for graph layout calculation.
 */
export interface GraphLayoutOptions {
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
  /** Node radius for collision detection */
  nodeRadius?: number
  /** Link distance */
  linkDistance?: number
  /** Charge strength (negative = repulsion) */
  chargeStrength?: number
  /** Center gravity */
  centerStrength?: number
  /** Number of simulation iterations */
  iterations?: number
}

/**
 * Calculate force-directed graph layout.
 */
export function calculateGraphLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: GraphLayoutOptions
): Promise<{ nodes: GraphNodeLayout[]; edges: GraphEdgeLayout[] }> {
  const {
    width,
    height,
    nodeRadius = 15,
    linkDistance = 100,
    chargeStrength = -300,
    centerStrength = 0.1,
    iterations = 300,
  } = options

  return new Promise((resolve) => {
    // Create node layout copies
    const nodeLayouts: GraphNodeLayout[] = nodes.map((node) => ({
      ...node,
      x: node.x ?? width / 2 + (Math.random() - 0.5) * 100,
      y: node.y ?? height / 2 + (Math.random() - 0.5) * 100,
      fx: node.x !== undefined ? node.x : null,
      fy: node.y !== undefined ? node.y : null,
    }))

    // Create node id map
    const nodeMap = new Map<string, GraphNodeLayout>()
    nodeLayouts.forEach((node) => nodeMap.set(node.id, node))

    // Create edge layouts with node references
    const edgeLayouts: GraphEdgeLayout[] = edges.map((edge) => ({
      source: nodeMap.get(edge.source)!,
      target: nodeMap.get(edge.target)!,
      weight: edge.weight,
    }))

    // Create simulation
    const simulation = forceSimulation<GraphNodeLayout>(nodeLayouts)
      .force(
        'link',
        forceLink<GraphNodeLayout, GraphEdgeLayout>(edgeLayouts)
          .id((d) => d.id)
          .distance(linkDistance)
      )
      .force('charge', forceManyBody().strength(chargeStrength))
      .force('center', forceCenter(width / 2, height / 2).strength(centerStrength))
      .force('collide', forceCollide(nodeRadius * 1.5))

    // Run simulation
    simulation.tick(iterations)
    simulation.stop()

    resolve({ nodes: nodeLayouts, edges: edgeLayouts })
  })
}

/**
 * Calculate preset layout (no force simulation).
 */
export function calculatePresetLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: Pick<GraphLayoutOptions, 'width' | 'height'>
): { nodes: GraphNodeLayout[]; edges: GraphEdgeLayout[] } {
  const { width, height } = options

  const nodeLayouts: GraphNodeLayout[] = nodes.map((node) => ({
    ...node,
    x: node.x ?? width / 2,
    y: node.y ?? height / 2,
  }))

  const nodeMap = new Map<string, GraphNodeLayout>()
  nodeLayouts.forEach((node) => nodeMap.set(node.id, node))

  const edgeLayouts: GraphEdgeLayout[] = edges.map((edge) => ({
    source: nodeMap.get(edge.source)!,
    target: nodeMap.get(edge.target)!,
    weight: edge.weight,
  }))

  return { nodes: nodeLayouts, edges: edgeLayouts }
}
