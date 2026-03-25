/**
 * @algoflow/visualizations
 * 
 * Visualization components for AlgoFlow - ArrayViz, TreeViz, GraphViz.
 */

// Components
export { default as ArrayViz } from './components/ArrayViz.vue'
export { default as TreeViz } from './components/TreeViz.vue'
export { default as GraphViz } from './components/GraphViz.vue'
export { default as StackViz } from './components/StackViz.vue'
export { default as QueueViz } from './components/QueueViz.vue'
export { default as HeapViz } from './components/HeapViz.vue'
export { default as BSTViz } from './components/BSTViz.vue'
export { default as SortingViz } from './components/SortingViz.vue'
export { default as PlayerControls } from './components/PlayerControls.vue'

// Types
export type { 
  // Core types
  AnimationStep,
  ActionType,
  VisualizationConfig,
  VisualizationColors,
  BaseVisualizationProps,
  VisualizationEvents,
  Orientation,
  // Array visualization
  ArrayVizProps,
  // Tree visualization
  TreeNode,
  TreeLayoutType,
  TreeVizProps,
  // Graph visualization
  GraphNode,
  GraphEdge,
  GraphData,
  GraphVizProps,
  // Stack visualization
  StackVizProps,
  // Queue visualization
  QueueVizProps,
  // Heap visualization
  HeapType,
  HeapVizProps,
  // BST visualization
  BSTVizProps,
  // Sorting visualization
  SortingAlgorithm,
  SortingVizProps,
  // Player state
  PlayerState,
} from './types'

// Color themes
export { COLOR_THEMES } from './types'

// Layouts
export { calculateArrayLayout } from './layouts/array'
export { calculateTreeLayout } from './layouts/tree'
export { calculateGraphLayout } from './layouts/graph'
