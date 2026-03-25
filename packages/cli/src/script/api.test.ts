import { describe, it, expect, beforeEach } from 'vitest'
import {
  createAlgoFlowAPI,
  type ScriptContext,
  type AlgoFlowAPI,
} from './api'

describe('AlgoFlow Script API', () => {
  let context: ScriptContext
  let api: AlgoFlowAPI

  beforeEach(() => {
    context = {
      output: {
        version: '1.0',
        type: 'array',
        initialData: [],
        steps: [],
      },
      data: [],
      logs: [],
      stopped: false,
    }
    api = createAlgoFlowAPI(context)
  })

  describe('initialization', () => {
    it('should set visualization type', () => {
      api.setType('tree')
      expect(context.output.type).toBe('tree')
    })

    it('should set initial data', () => {
      api.setData([5, 3, 8, 1])
      expect(context.output.initialData).toEqual([5, 3, 8, 1])
      expect(context.data).toEqual([5, 3, 8, 1])
    })

    it('should set metadata', () => {
      api.setMetadata({
        title: 'Bubble Sort',
        algorithm: 'bubble',
        complexity: { time: 'O(n²)', space: 'O(1)' },
      })
      
      expect(context.output.metadata).toEqual({
        title: 'Bubble Sort',
        algorithm: 'bubble',
        complexity: { time: 'O(n²)', space: 'O(1)' },
      })
    })

    it('should set config', () => {
      api.setConfig({ barWidth: 40, showValues: true })
      expect(context.output.config).toEqual({ barWidth: 40, showValues: true })
    })
  })

  describe('data operations', () => {
    beforeEach(() => {
      api.setData([10, 20, 30])
    })

    it('should get data', () => {
      const data = api.getData()
      expect(data).toEqual([10, 20, 30])
    })

    it('should get length', () => {
      expect(api.length()).toBe(3)
    })

    it('should get element at index', () => {
      expect(api.get(0)).toBe(10)
      expect(api.get(1)).toBe(20)
      expect(api.get(2)).toBe(30)
      expect(api.get(10)).toBeUndefined()
    })

    it('should set element at index', () => {
      api.set(1, 25)
      expect(context.data[1]).toBe(25)
    })

    it('should swap elements', () => {
      api.swap(0, 2)
      expect(context.data).toEqual([30, 20, 10])
    })
  })

  describe('animation steps', () => {
    beforeEach(() => {
      api.setData([5, 3, 8])
    })

    it('should add highlight step', () => {
      api.highlight(0, 'First element')
      
      expect(context.output.steps).toHaveLength(1)
      expect(context.output.steps![0]).toEqual({
        action: 'highlight',
        target: [0],
        duration: 300,
        description: 'First element',
      })
    })

    it('should add highlight step with array target', () => {
      api.highlight([0, 1], 'Comparing')
      
      expect(context.output.steps![0].target).toEqual([0, 1])
    })

    it('should add unhighlight step', () => {
      api.unhighlight(0)
      
      expect(context.output.steps![0].action).toBe('unhighlight')
    })

    it('should add compare step', () => {
      api.compare([0, 1], 'Comparing 5 and 3')
      
      expect(context.output.steps![0].action).toBe('compare')
      expect(context.output.steps![0].target).toEqual([0, 1])
    })

    it('should add swap step and swap data', () => {
      api.swapAnimated(0, 1, 'Swap 5 and 3')
      
      expect(context.data).toEqual([3, 5, 8])
      expect(context.output.steps![0].action).toBe('swap')
      expect(context.output.steps![0].target).toEqual([0, 1])
    })

    it('should add complete step', () => {
      api.complete(0, 'Element sorted')
      
      expect(context.output.steps![0].action).toBe('complete')
    })

    it('should add activate step', () => {
      api.activate(0, 'Active element')
      
      expect(context.output.steps![0].action).toBe('activate')
    })

    it('should add deactivate step', () => {
      api.deactivate(0)
      
      expect(context.output.steps![0].action).toBe('deactivate')
    })

    it('should add custom step', () => {
      api.addStep({
        action: 'highlight',
        target: [0],
        description: 'custom highlight',
      })
      
      expect(context.output.steps![0].action).toBe('highlight')
      expect(context.output.steps![0].description).toBe('custom highlight')
    })
  })

  describe('stack operations', () => {
    beforeEach(() => {
      api.setType('stack')
      api.setData([10, 20])
    })

    it('should push element', () => {
      api.push(30, 'Push 30')
      
      expect(context.data).toEqual([10, 20, 30])
      expect(context.output.steps![0].action).toBe('push')
      expect(context.output.steps![0].value).toBe(30)
    })

    it('should pop element', () => {
      const value = api.pop('Pop top')
      
      expect(value).toBe(20)
      expect(context.data).toEqual([10])
      expect(context.output.steps![0].action).toBe('pop')
    })

    it('should peek element', () => {
      api.peek('Peek top')
      
      expect(context.output.steps![0].action).toBe('peek')
      expect(context.output.steps![0].target).toBe(1)
    })
  })

  describe('queue operations', () => {
    beforeEach(() => {
      api.setType('queue')
      api.setData([1, 2])
    })

    it('should enqueue element', () => {
      api.enqueue(3, 'Enqueue 3')
      
      expect(context.data).toEqual([1, 2, 3])
      expect(context.output.steps![0].action).toBe('enqueue')
    })

    it('should dequeue element', () => {
      const value = api.dequeue('Dequeue front')
      
      expect(value).toBe(1)
      expect(context.data).toEqual([2])
      expect(context.output.steps![0].action).toBe('dequeue')
    })
  })

  describe('utility methods', () => {
    it('should log messages', () => {
      api.log('Hello')
      api.log('World')
      
      expect(context.logs).toEqual(['Hello', 'World'])
    })

    it('should delay execution', async () => {
      const start = Date.now()
      await api.delay(50)
      const elapsed = Date.now() - start
      
      expect(elapsed).toBeGreaterThanOrEqual(40)
    })
  })
})
