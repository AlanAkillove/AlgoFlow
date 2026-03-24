import { tree as d3Tree, hierarchy } from 'd3-hierarchy'
import type { TreeNode } from '../types'

/**
 * Tree node layout calculation result.
 */
export interface TreeNodeLayout {
  /** Node ID */
  id: string
  /** Node value */
  value: number | string
  /** X position */
  x: number
  /** Y position */
  y: number
  /** Depth in tree */
  depth: number
  /** Children */
  children: TreeNodeLayout[]
  /** Parent node (if any) */
  parent?: TreeNodeLayout
}

/**
 * Options for tree layout calculation.
 */
export interface TreeLayoutOptions {
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
  /** Horizontal spacing between nodes */
  horizontalSpacing?: number
  /** Vertical spacing between levels */
  verticalSpacing?: number
  /** Padding around edges */
  padding?: number
  /** Node radius for boundary calculation */
  nodeRadius?: number
}

/**
 * Calculate tree layout using d3-hierarchy with auto-scaling.
 */
export function calculateTreeLayout(
  rootData: TreeNode,
  options: TreeLayoutOptions
): TreeNodeLayout {
  const {
    width,
    height,
    padding = 50,
    nodeRadius = 20,
  } = options

  // Create hierarchy
  const root = hierarchy(rootData, (d) => d.children)
  
  // Get tree depth and width for calculating optimal spacing
  const treeDepth = root.height // max depth
  const leaves = root.leaves() // all leaf nodes
  const treeWidth = leaves.length
  
  // Calculate optimal node spacing based on tree size
  const minHorizontalSpacing = nodeRadius * 2.5
  const minVerticalSpacing = nodeRadius * 3.5
  
  // Calculate available space with more padding for edges
  const availableWidth = width - padding * 2
  const availableHeight = height - padding * 2 - nodeRadius * 2
  
  // Calculate spacing based on tree dimensions
  const horizontalSpacing = Math.max(minHorizontalSpacing, availableWidth / Math.max(treeWidth, 1))
  const verticalSpacing = Math.max(minVerticalSpacing, availableHeight / Math.max(treeDepth + 1, 1))

  // Calculate tree layout - note: d3 tree is horizontal by default
  // We swap x and y to make it vertical (top to bottom)
  const treeLayout = d3Tree<TreeNode>()
    .size([availableWidth, availableHeight]) // x = width, y = height
    .separation((a, b) => {
      // Better separation formula
      return a.parent === b.parent ? 1 : 1.5
    })

  treeLayout(root)

  // Find bounds for auto-scaling
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  
  root.descendants().forEach((node) => {
    minX = Math.min(minX, node.x ?? 0)
    maxX = Math.max(maxX, node.x ?? 0)
    minY = Math.min(minY, node.y ?? 0)
    maxY = Math.max(maxY, node.y ?? 0)
  })
  
  // Calculate scale to fit within bounds
  const treeActualWidth = maxX - minX || 1
  const treeActualHeight = maxY - minY || 1
  
  // Scale to fit with some margin
  const scaleX = availableWidth / treeActualWidth
  const scaleY = availableHeight / treeActualHeight
  const scale = Math.min(scaleX, scaleY, 1.2) // Limit scale up
  
  // Center the tree
  const scaledWidth = treeActualWidth * scale
  const scaledHeight = treeActualHeight * scale
  const centerOffsetX = (width - scaledWidth) / 2
  const centerOffsetY = padding + nodeRadius

  // Convert to our layout format with scaling
  const layoutMap = new Map<string, TreeNodeLayout>()

  root.descendants().forEach((node) => {
    // Apply scale and center offset
    const scaledX = ((node.x ?? 0) - minX) * scale + centerOffsetX
    const scaledY = ((node.y ?? 0) - minY) * scale + centerOffsetY
    
    const layoutNode: TreeNodeLayout = {
      id: node.data.id,
      value: node.data.value,
      x: scaledX,
      y: scaledY,
      depth: node.depth,
      children: [],
    }
    layoutMap.set(node.data.id, layoutNode)
  })

  // Link children and parents
  root.descendants().forEach((node) => {
    const layoutNode = layoutMap.get(node.data.id)!
    if (node.children) {
      layoutNode.children = node.children.map((child) => layoutMap.get(child.data.id)!)
      layoutNode.children.forEach((child) => {
        child.parent = layoutNode
      })
    }
  })

  return layoutMap.get(rootData.id)!
}

/**
 * Get all edges from a tree layout.
 */
export function getTreeEdges(root: TreeNodeLayout): Array<{ source: TreeNodeLayout; target: TreeNodeLayout }> {
  const edges: Array<{ source: TreeNodeLayout; target: TreeNodeLayout }> = []

  function traverse(node: TreeNodeLayout): void {
    node.children.forEach((child) => {
      edges.push({ source: node, target: child })
      traverse(child)
    })
  }

  traverse(root)
  return edges
}
