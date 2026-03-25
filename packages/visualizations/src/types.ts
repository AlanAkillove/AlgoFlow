/**
 * @algoflow/visualizations - Type Definitions
 * 
 * 统一的可视化组件类型系统
 */

// ============================================
// 从 @algoflow/animation 重新导出动画类型
// ============================================

export type { AnimationStep, ActionType, StepTarget } from '@algoflow/animation'

// ============================================
// 颜色主题配置
// ============================================

/**
 * 可视化颜色配置
 */
export interface VisualizationColors {
  /** 主色调（默认元素颜色） */
  primary?: string
  
  /** 高亮颜色 */
  highlight?: string
  
  /** 比较中颜色 */
  comparing?: string
  
  /** 已完成颜色 */
  complete?: string
  
  /** 激活颜色 */
  active?: string
  
  /** 错误/警告颜色 */
  error?: string
  
  /** 背景颜色 */
  background?: string
  
  /** 文字颜色 */
  text?: string
  
  /** 边框颜色 */
  border?: string
}

/**
 * 预设颜色主题
 */
export const COLOR_THEMES = {
  default: {
    primary: '#64748b',
    highlight: '#3b82f6',
    comparing: '#f59e0b',
    complete: '#22c55e',
    active: '#8b5cf6',
    error: '#ef4444',
  },
  pastel: {
    primary: '#94a3b8',
    highlight: '#60a5fa',
    comparing: '#fbbf24',
    complete: '#4ade80',
    active: '#a78bfa',
    error: '#f87171',
  },
  vibrant: {
    primary: '#475569',
    highlight: '#2563eb',
    comparing: '#d97706',
    complete: '#16a34a',
    active: '#7c3aed',
    error: '#dc2626',
  },
} as const

// ============================================
// 基础配置接口
// ============================================

/**
 * 可视化基础配置
 */
export interface VisualizationConfig {
  /** 可视化宽度 */
  width?: number
  
  /** 可视化高度 */
  height?: number
  
  /** 内边距 */
  padding?: number
  
  /** 动画速度倍数 (0.1 - 10) */
  speed?: number
  
  /** 颜色配置 */
  colors?: VisualizationColors
  
  /** 是否显示元素标签 */
  showLabels?: boolean
  
  /** 是否显示索引 */
  showIndices?: boolean
  
  /** 是否启用动画 */
  animate?: boolean
  
  /** 是否自动播放 */
  autoPlay?: boolean
}

/**
 * 布局方向
 */
export type Orientation = 'horizontal' | 'vertical'

// ============================================
// 基础 Props 接口
// ============================================

/**
 * 可视化组件事件回调
 */
export interface VisualizationEvents {
  /** 步骤变化回调 */
  onStep?: (index: number, step: AnimationStep) => void
  
  /** 动画完成回调 */
  onComplete?: () => void
  
  /** 重置回调 */
  onReset?: () => void
  
  /** 错误回调 */
  onError?: (error: Error) => void
  
  /** 播放状态变化回调 */
  onPlayStateChange?: (isPlaying: boolean) => void
}

/**
 * 所有可视化组件必须实现的基础 Props
 */
export interface BaseVisualizationProps<T = unknown> {
  /** 初始数据 */
  data: T
  
  /** 动画步骤 */
  steps?: AnimationStep[]
  
  /** 当前步骤索引（外部控制） */
  stepIndex?: number
  
  /** 配置选项 */
  config?: VisualizationConfig
  
  /** 事件回调 */
  onStep?: (index: number, step: AnimationStep) => void
  onComplete?: () => void
  onError?: (error: Error) => void
}

// ============================================
// 数组可视化类型
// ============================================

/**
 * 数组可视化 Props
 */
export interface ArrayVizProps extends BaseVisualizationProps<number[]> {
  /** 柱状条宽度 */
  barWidth?: number
  
  /** 柱状条间距 */
  gap?: number
  
  /** 是否显示数值 */
  showValues?: boolean
  
  /** 布局方向 */
  orientation?: Orientation
  
  /** 最小柱高度比例 (0-1) */
  minHeightRatio?: number
}

// ============================================
// 树可视化类型
// ============================================

/**
 * 树节点数据结构
 */
export interface TreeNode {
  /** 节点值 */
  value: number | string
  
  /** 唯一标识符 */
  id: string
  
  /** 子节点 */
  children?: TreeNode[]
  
  /** 额外数据（如平衡因子、颜色等） */
  meta?: Record<string, unknown>
}

/**
 * 树布局类型
 */
export type TreeLayoutType = 'vertical' | 'horizontal' | 'radial'

/**
 * 树可视化 Props
 */
export interface TreeVizProps extends BaseVisualizationProps<TreeNode> {
  /** 节点半径 */
  nodeRadius?: number
  
  /** 水平间距 */
  horizontalSpacing?: number
  
  /** 垂直间距 */
  verticalSpacing?: number
  
  /** 是否显示节点值 */
  showValues?: boolean
  
  /** 布局类型 */
  layout?: TreeLayoutType
  
  /** 是否显示连接线 */
  showEdges?: boolean
  
  /** 是否显示节点 ID */
  showIds?: boolean
}

// ============================================
// 图可视化类型
// ============================================

/**
 * 图节点数据结构
 */
export interface GraphNode {
  /** 节点 ID */
  id: string
  
  /** 节点值/标签 */
  value?: number | string
  
  /** 固定 X 坐标（可选） */
  x?: number
  
  /** 固定 Y 坐标（可选） */
  y?: number
  
  /** 节点大小 */
  size?: number
  
  /** 额外数据 */
  meta?: Record<string, unknown>
}

/**
 * 图边数据结构
 */
export interface GraphEdge {
  /** 源节点 ID */
  source: string
  
  /** 目标节点 ID */
  target: string
  
  /** 边权重 */
  weight?: number
  
  /** 是否为有向边 */
  directed?: boolean
  
  /** 边标签 */
  label?: string
}

/**
 * 图数据结构
 */
export interface GraphData {
  /** 节点列表 */
  nodes: GraphNode[]
  
  /** 边列表 */
  edges: GraphEdge[]
}

/**
 * 图可视化 Props
 */
export interface GraphVizProps extends BaseVisualizationProps<GraphData> {
  /** 是否为有向图 */
  directed?: boolean
  
  /** 是否使用力导向布局 */
  useForceLayout?: boolean
  
  /** 节点半径 */
  nodeRadius?: number
  
  /** 是否显示节点标签 */
  showLabels?: boolean
  
  /** 是否显示边权重 */
  showWeights?: boolean
  
  /** 力导向布局参数 */
  forceLayoutConfig?: {
    /** 节点间斥力 */
    repulsion?: number
    /** 边的弹簧力 */
    springLength?: number
    /** 弹簧刚度 */
    springStrength?: number
  }
}

// ============================================
// 栈可视化类型
// ============================================

/**
 * 栈可视化 Props
 */
export interface StackVizProps extends BaseVisualizationProps<(number | string)[]> {
  /** 元素高度 */
  itemHeight?: number
  
  /** 元素宽度 */
  itemWidth?: number
  
  /** 是否显示值 */
  showValues?: boolean
  
  /** 栈最大显示高度（元素数） */
  maxVisibleItems?: number
}

// ============================================
// 队列可视化类型
// ============================================

/**
 * 队列可视化 Props
 */
export interface QueueVizProps extends BaseVisualizationProps<(number | string)[]> {
  /** 元素大小 */
  itemSize?: number
  
  /** 是否显示值 */
  showValues?: boolean
  
  /** 是否为循环队列 */
  circular?: boolean
  
  /** 队列容量（用于循环队列） */
  capacity?: number
  
  /** 显示头尾指针 */
  showPointers?: boolean
}

// ============================================
// 堆可视化类型
// ============================================

/**
 * 堆类型
 */
export type HeapType = 'min' | 'max'

/**
 * 堆可视化 Props
 */
export interface HeapVizProps extends BaseVisualizationProps<number[]> {
  /** 堆类型 */
  heapType?: HeapType
  
  /** 节点半径 */
  nodeRadius?: number
  
  /** 是否显示值 */
  showValues?: boolean
  
  /** 是否显示索引 */
  showIndices?: boolean
}

// ============================================
// 二叉搜索树可视化类型
// ============================================

/**
 * BST 可视化 Props
 */
export interface BSTVizProps extends BaseVisualizationProps<number[]> {
  /** 节点半径 */
  nodeRadius?: number
  
  /** 是否显示值 */
  showValues?: boolean
  
  /** 高亮插入/删除路径 */
  highlightPath?: boolean
}

// ============================================
// 排序可视化类型
// ============================================

/**
 * 支持的排序算法
 */
export type SortingAlgorithm = 
  | 'bubble'
  | 'selection'
  | 'insertion'
  | 'merge'
  | 'quick'
  | 'heap'
  | 'counting'
  | 'radix'

/**
 * 排序可视化 Props
 */
export interface SortingVizProps extends Omit<ArrayVizProps, 'steps'> {
  /** 排序算法 */
  algorithm: SortingAlgorithm
  
  /** 是否自动生成步骤 */
  autoGenerateSteps?: boolean
}

// ============================================
// 播放器状态
// ============================================

/**
 * 动画播放器状态
 */
export interface PlayerState {
  /** 是否正在播放 */
  isPlaying: boolean
  
  /** 当前步骤索引 */
  currentIndex: number
  
  /** 总步骤数 */
  totalSteps: number
  
  /** 播放速度 */
  speed: number
  
  /** 是否可以上一步 */
  canPrev: boolean
  
  /** 是否可以下一步 */
  canNext: boolean
}

// ============================================
// 类型已在上方定义并导出，无需重复导出
// ============================================
