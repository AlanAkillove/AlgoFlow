import type { AnimationStep } from '@algoflow/animation'

/**
 * Base visualization configuration.
 */
export interface VisualizationConfig {
  /** Width of the visualization */
  width?: number
  /** Height of the visualization */
  height?: number
  /** Padding around elements */
  padding?: number
  /** Animation speed multiplier */
  speed?: number
  /** Primary color for elements */
  primaryColor?: string
  /** Highlight color */
  highlightColor?: string
  /** Background color */
  backgroundColor?: string
}

/**
 * Base props for all visualization components.
 */
export interface VisualizationProps<T = unknown> {
  /** Initial data to render */
  data: T[]
  /** Animation steps */
  steps?: AnimationStep[]
  /** Current step index for external control */
  stepIndex?: number
  /** Styling configuration */
  config?: VisualizationConfig
}

/**
 * Array visualization props.
 */
export interface ArrayVizProps extends VisualizationProps<number> {
  /** Bar width */
  barWidth?: number
  /** Gap between bars */
  gap?: number
  /** Show values on bars */
  showValues?: boolean
  /** Horizontal or vertical orientation */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Tree node data structure.
 */
export interface TreeNode {
  /** Node value */
  value: number | string
  /** Unique identifier */
  id: string
  /** Child nodes */
  children?: TreeNode[]
}

/**
 * Tree visualization props.
 */
export interface TreeVizProps extends VisualizationProps<TreeNode> {
  /** Node radius */
  nodeRadius?: number
  /** Horizontal spacing */
  horizontalSpacing?: number
  /** Vertical spacing */
  verticalSpacing?: number
  /** Show node values */
  showValues?: boolean
}

/**
 * Graph node data structure.
 */
export interface GraphNode {
  /** Node ID */
  id: string
  /** Node value/label */
  value?: number | string
  /** Fixed X position (optional) */
  x?: number
  /** Fixed Y position (optional) */
  y?: number
}

/**
 * Graph edge data structure.
 */
export interface GraphEdge {
  /** Source node ID */
  source: string
  /** Target node ID */
  target: string
  /** Edge weight */
  weight?: number
}

/**
 * Graph visualization props.
 */
export interface GraphVizProps {
  /** Graph nodes */
  nodes: GraphNode[]
  /** Graph edges */
  edges: GraphEdge[]
  /** Animation steps */
  steps?: AnimationStep[]
  /** Current step index */
  stepIndex?: number
  /** Configuration */
  config?: VisualizationConfig
  /** Node radius */
  nodeRadius?: number
  /** Show node labels */
  showLabels?: boolean
  /** Use force-directed layout */
  useForceLayout?: boolean
}
