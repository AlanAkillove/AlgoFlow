import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import schema from './animation.json'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const validate = ajv.compile(schema)

describe('AI Generated Animation JSON Validation', () => {
  // 模拟 AI 生成的冒泡排序动画
  it('should validate AI-generated bubble sort animation', () => {
    const aiGeneratedBubbleSort = {
      version: '1.0',
      type: 'array',
      initialData: [64, 34, 25, 12, 22, 11, 90],
      steps: [
        { action: 'compare', target: [0, 1], duration: 300, description: 'Compare 64 and 34' },
        { action: 'swap', target: [0, 1], duration: 300, description: 'Swap 64 and 34' },
        { action: 'compare', target: [1, 2], duration: 300, description: 'Compare 64 and 25' },
        { action: 'swap', target: [1, 2], duration: 300, description: 'Swap 64 and 25' },
        { action: 'complete', target: [6], duration: 300, description: 'Position 6 sorted' },
      ],
      metadata: {
        title: 'Bubble Sort',
        algorithm: 'bubble',
        complexity: { time: 'O(n²)', space: 'O(1)' },
      },
    }
    
    const valid = validate(aiGeneratedBubbleSort)
    expect(valid).toBe(true)
  })

  // 模拟 AI 生成的快速排序动画
  it('should validate AI-generated quick sort animation', () => {
    const aiGeneratedQuickSort = {
      version: '1.0',
      type: 'array',
      initialData: [10, 7, 8, 9, 1, 5],
      steps: [
        { action: 'highlight', target: [5], duration: 300, description: 'Pivot: 5' },
        { action: 'compare', target: [0, 5], duration: 300, description: 'Compare 10 with pivot' },
        { action: 'swap', target: [0, 4], duration: 300, description: 'Place pivot' },
        { action: 'complete', target: [1], duration: 300, description: 'Pivot in position' },
      ],
    }
    
    const valid = validate(aiGeneratedQuickSort)
    expect(valid).toBe(true)
  })

  // 模拟 AI 生成的栈操作动画
  it('should validate AI-generated stack operations animation', () => {
    const aiGeneratedStack = {
      version: '1.0',
      type: 'stack',
      initialData: [10, 20, 30],
      steps: [
        { action: 'peek', target: [2], duration: 300, description: 'Peek top' },
        { action: 'push', target: [3], value: 40, duration: 300, description: 'Push 40' },
        { action: 'pop', target: [3], duration: 300, description: 'Pop top' },
      ],
    }
    
    const valid = validate(aiGeneratedStack)
    expect(valid).toBe(true)
  })

  // 模拟 AI 生成的队列操作动画
  it('should validate AI-generated queue operations animation', () => {
    const aiGeneratedQueue = {
      version: '1.0',
      type: 'queue',
      initialData: [1, 2, 3],
      steps: [
        { action: 'enqueue', target: [3], value: 4, duration: 300, description: 'Enqueue 4' },
        { action: 'dequeue', target: [0], duration: 300, description: 'Dequeue 1' },
      ],
    }
    
    const valid = validate(aiGeneratedQueue)
    expect(valid).toBe(true)
  })

  // 模拟 AI 生成的堆操作动画
  it('should validate AI-generated heap operations animation', () => {
    const aiGeneratedHeap = {
      version: '1.0',
      type: 'heap',
      initialData: [16, 14, 10, 8, 7, 9, 3, 2, 4, 1],
      config: {
        heapType: 'max',
      },
      steps: [
        { action: 'highlight', target: [0], duration: 300, description: 'Root: 16' },
        { action: 'compare', target: [1, 2], duration: 300, description: 'Compare children' },
      ],
    }
    
    const valid = validate(aiGeneratedHeap)
    expect(valid).toBe(true)
  })

  // 模拟 AI 生成的 BST 操作动画
  it('should validate AI-generated BST operations animation', () => {
    const aiGeneratedBST = {
      version: '1.0',
      type: 'bst',
      initialData: {
        id: 'root',
        value: 50,
        children: [
          { id: 'left', value: 30, children: [] },
          { id: 'right', value: 70, children: [] },
        ],
      },
      steps: [
        { action: 'highlight', target: ['root'], duration: 300, description: 'Root: 50' },
        { action: 'traverse', target: ['left'], duration: 300, description: 'Go left' },
      ],
    }
    
    const valid = validate(aiGeneratedBST)
    expect(valid).toBe(true)
  })

  // 模拟 AI 生成的图遍历动画
  it('should validate AI-generated graph traversal animation', () => {
    const aiGeneratedGraph = {
      version: '1.0',
      type: 'graph',
      initialData: {
        nodes: [
          { id: 'A', label: 'A' },
          { id: 'B', label: 'B' },
          { id: 'C', label: 'C' },
        ],
        edges: [
          { source: 'A', target: 'B' },
          { source: 'B', target: 'C' },
          { source: 'A', target: 'C' },
        ],
      },
      steps: [
        { action: 'highlight', target: ['A'], duration: 300, description: 'Start at A' },
        { action: 'traverse', target: ['A', 'B'], duration: 300, description: 'A -> B' },
        { action: 'highlight', target: ['B'], duration: 300, description: 'Visit B' },
      ],
    }
    
    const valid = validate(aiGeneratedGraph)
    expect(valid).toBe(true)
  })

  // 测试无效的 JSON（缺少必需字段）
  it('should reject invalid JSON missing required fields', () => {
    const invalidJSON = {
      type: 'array',
      initialData: [1, 2, 3],
      // missing version and steps
    }
    
    const valid = validate(invalidJSON)
    expect(valid).toBe(false)
  })

  // 测试无效的 action 类型
  it('should reject invalid action type', () => {
    const invalidAction = {
      version: '1.0',
      type: 'array',
      initialData: [1, 2, 3],
      steps: [
        { action: 'invalid-action', target: [0], duration: 300 },
      ],
    }
    
    const valid = validate(invalidAction)
    expect(valid).toBe(false)
  })

  // 测试无效的可视化类型
  it('should reject invalid visualization type', () => {
    const invalidType = {
      version: '1.0',
      type: 'invalid-type',
      initialData: [1, 2, 3],
      steps: [],
    }
    
    const valid = validate(invalidType)
    expect(valid).toBe(false)
  })

  // 测试复杂排序动画
  it('should validate complex sorting animation with many steps', () => {
    const complexSorting = {
      version: '1.0',
      type: 'sorting',
      initialData: [5, 2, 9, 1, 7, 6, 8, 3, 4],
      config: {
        algorithm: 'merge',
        showIndices: true,
      },
      steps: [
        { action: 'compare', target: [0, 1], duration: 200 },
        { action: 'swap', target: [0, 1], duration: 300 },
        { action: 'compare', target: [2, 3], duration: 200 },
        { action: 'swap', target: [2, 3], duration: 300 },
        { action: 'compare', target: [0, 2], duration: 200 },
        { action: 'highlight', target: [0, 1, 2, 3], duration: 300, description: 'Merging' },
        { action: 'complete', target: [0, 1, 2, 3, 4, 5, 6, 7, 8], duration: 500, description: 'Sorted!' },
      ],
      metadata: {
        title: 'Merge Sort',
        algorithm: 'merge',
        complexity: { time: 'O(n log n)', space: 'O(n)' },
      },
    }
    
    const valid = validate(complexSorting)
    expect(valid).toBe(true)
  })
})
