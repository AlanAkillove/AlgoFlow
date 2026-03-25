/**
 * AlgoFlow Script API
 * 
 * 安全的脚本执行 API，用于生成动画步骤
 */

import type { AnimationStep } from '@algoflow/animation'

// ============================================
// 核心类型定义
// ============================================

/**
 * 可视化类型
 */
export type VizType = 'array' | 'tree' | 'graph' | 'stack' | 'queue' | 'heap' | 'bst' | 'sorting'

/**
 * 动画输出结构
 */
export interface AnimationOutput {
  version: '1.0'
  type: VizType
  initialData: number[] | string[] | object
  config?: Record<string, unknown>
  steps: AnimationStep[]
  metadata?: {
    title?: string
    author?: string
    algorithm?: string
    description?: string
    complexity?: {
      time?: string
      space?: string
    }
  }
}

/**
 * 脚本执行上下文
 */
export interface ScriptContext {
  /** 输出动画数据 */
  output: AnimationOutput
  
  /** 当前数据（可读写） */
  data: (number | string)[]
  
  /** 执行日志 */
  logs: string[]
  
  /** 是否已停止 */
  stopped: boolean
  
  /** 错误信息 */
  error?: string
}

/**
 * 脚本执行选项
 */
export interface ScriptOptions {
  /** 执行超时时间（毫秒），默认 5000 */
  timeout?: number
  
  /** 内存限制（MB），默认 128 */
  memoryLimit?: number
  
  /** 是否允许 console.log */
  allowConsole?: boolean
  
  /** 最大步骤数限制 */
  maxSteps?: number
}

/**
 * 脚本执行结果
 */
export interface ScriptResult {
  /** 是否成功 */
  success: boolean
  
  /** 生成的动画数据 */
  animation?: AnimationOutput
  
  /** 错误信息 */
  error?: string
  
  /** 执行日志 */
  logs: string[]
  
  /** 执行时间（毫秒） */
  duration: number
}

// ============================================
// AlgoFlow API - 暴露给脚本的接口
// ============================================

/**
 * AlgoFlow API 接口
 * 脚本通过此 API 生成动画
 */
export interface AlgoFlowAPI {
  // ============================================
  // 初始化
  // ============================================
  
  /**
   * 设置可视化类型
   */
  setType(type: VizType): void
  
  /**
   * 设置初始数据
   */
  setData(data: number[] | string[]): void
  
  /**
   * 设置配置
   */
  setConfig(config: Record<string, unknown>): void
  
  /**
   * 设置元数据
   */
  setMetadata(metadata: AnimationOutput['metadata']): void
  
  // ============================================
  // 数据操作
  // ============================================
  
  /**
   * 获取当前数据
   */
  getData(): (number | string)[]
  
  /**
   * 获取数据长度
   */
  length(): number
  
  /**
   * 获取指定索引的值
   */
  get(index: number): number | string | undefined
  
  /**
   * 设置指定索引的值
   */
  set(index: number, value: number | string): void
  
  /**
   * 交换两个位置的值
   */
  swap(i: number, j: number): void
  
  // ============================================
  // 动画步骤生成
  // ============================================
  
  /**
   * 高亮元素
   */
  highlight(target: number | number[], description?: string): void
  
  /**
   * 取消高亮
   */
  unhighlight(target: number | number[]): void
  
  /**
   * 比较元素
   */
  compare(target: number | number[], description?: string): void
  
  /**
   * 交换元素（带动画）
   */
  swapAnimated(i: number, j: number, description?: string): void
  
  /**
   * 标记完成
   */
  complete(target: number | number[], description?: string): void
  
  /**
   * 栈操作：入栈
   */
  push(value: number | string, description?: string): void
  
  /**
   * 栈操作：出栈
   */
  pop(description?: string): number | string | undefined
  
  /**
   * 栈操作：查看栈顶
   */
  peek(description?: string): void
  
  /**
   * 队列操作：入队
   */
  enqueue(value: number | string, description?: string): void
  
  /**
   * 队列操作：出队
   */
  dequeue(description?: string): number | string | undefined
  
  /**
   * 激活元素
   */
  activate(target: number | number[], description?: string): void
  
  /**
   * 取消激活
   */
  deactivate(target: number | number[]): void
  
  /**
   * 添加自定义步骤
   */
  addStep(step: Partial<AnimationStep>): void
  
  // ============================================
  // 工具方法
  // ============================================
  
  /**
   * 日志输出
   */
  log(message: string): void
  
  /**
   * 延迟执行
   */
  delay(ms: number): Promise<void>
}

// ============================================
// API 实现工厂
// ============================================

/**
 * 创建 AlgoFlow API 实例
 */
export function createAlgoFlowAPI(context: ScriptContext): AlgoFlowAPI {
  const { output, logs } = context
  
  // 确保 steps 数组存在
  if (!output.steps) {
    output.steps = []
  }
  
  // 默认动画持续时间
  const defaultDuration = 300
  
  // 目标数组化辅助函数
  const toArray = (target: number | number[]): number[] => 
    Array.isArray(target) ? target : [target]
  
  return {
    // 初始化
    setType(type) {
      output.type = type
    },
    
    setData(data) {
      output.initialData = [...data]
      context.data = [...data]
    },
    
    setConfig(config) {
      output.config = { ...output.config, ...config }
    },
    
    setMetadata(metadata) {
      output.metadata = { ...output.metadata, ...metadata }
    },
    
    // 数据操作
    getData() {
      return [...context.data]
    },
    
    length() {
      return context.data.length
    },
    
    get(index) {
      return context.data[index]
    },
    
    set(index, value) {
      if (index >= 0 && index < context.data.length) {
        context.data[index] = value as (number | string)
      }
    },
    
    swap(i, j) {
      const temp = context.data[i]
      context.data[i] = context.data[j]
      context.data[j] = temp
    },
    
    // 动画步骤生成
    highlight(target, description) {
      output.steps.push({
        action: 'highlight',
        target: toArray(target),
        duration: defaultDuration,
        description,
      })
    },
    
    unhighlight(target) {
      output.steps.push({
        action: 'unhighlight',
        target: toArray(target),
        duration: 100,
      })
    },
    
    compare(target, description) {
      output.steps.push({
        action: 'compare',
        target: toArray(target),
        duration: defaultDuration,
        description,
      })
    },
    
    swapAnimated(i, j, description) {
      // 先交换数据
      const temp = context.data[i]
      context.data[i] = context.data[j]
      context.data[j] = temp
      
      // 添加动画步骤
      output.steps.push({
        action: 'swap',
        target: [i, j],
        duration: defaultDuration,
        description,
      })
    },
    
    complete(target, description) {
      output.steps.push({
        action: 'complete',
        target: toArray(target),
        duration: defaultDuration,
        description,
      })
    },
    
    push(value, description) {
      context.data.push(value as (number | string))
      output.steps.push({
        action: 'push',
        target: context.data.length - 1,
        value,
        duration: defaultDuration,
        description,
      })
    },
    
    pop(description) {
      const value = context.data.pop()
      output.steps.push({
        action: 'pop',
        target: context.data.length,
        duration: defaultDuration,
        description,
      })
      return value
    },
    
    peek(description) {
      output.steps.push({
        action: 'peek',
        target: context.data.length - 1,
        duration: defaultDuration,
        description,
      })
    },
    
    enqueue(value, description) {
      context.data.push(value as (number | string))
      output.steps.push({
        action: 'enqueue',
        target: context.data.length - 1,
        value,
        duration: defaultDuration,
        description,
      })
    },
    
    dequeue(description) {
      const value = context.data.shift()
      output.steps.push({
        action: 'dequeue',
        target: 0,
        duration: defaultDuration,
        description,
      })
      return value
    },
    
    activate(target, description) {
      output.steps.push({
        action: 'activate',
        target: toArray(target),
        duration: defaultDuration,
        description,
      })
    },
    
    deactivate(target) {
      output.steps.push({
        action: 'deactivate',
        target: toArray(target),
        duration: 100,
      })
    },
    
    addStep(step) {
      output.steps.push({
        action: 'highlight',
        target: 0,
        duration: defaultDuration,
        ...step,
      } as AnimationStep)
    },
    
    // 工具方法
    log(message) {
      logs.push(message)
    },
    
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },
  }
}
