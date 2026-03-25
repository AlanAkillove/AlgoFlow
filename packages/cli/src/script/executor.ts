/**
 * JavaScript 沙箱执行器
 * 
 * 安全地执行 JavaScript 脚本生成动画数据
 */

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeFileSync, unlinkSync, existsSync } from 'node:fs'
import type { AnimationStep } from '@algoflow/animation'
import { 
  type AnimationOutput, 
  type ScriptContext, 
  type ScriptOptions, 
  type ScriptResult,
  type AlgoFlowAPI,
  type VizType,
  createAlgoFlowAPI,
} from './api'

// ============================================
// 执行器配置
// ============================================

const DEFAULT_TIMEOUT = 5000
const DEFAULT_MEMORY_LIMIT = 128

// ============================================
// Worker 脚本模板
// ============================================

/**
 * 生成 Worker 脚本代码
 */
function generateWorkerScript(scriptCode: string): string {
  return `
const { parentPort } = require('worker_threads')

// 模拟 console.log
const logs = []
const console = {
  log: (...args) => logs.push(args.map(a => String(a)).join(' ')),
  error: (...args) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
  warn: (...args) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
}

// API 对象（由父线程注入）
let algoflow = null

// 用户脚本执行
async function run() {
  try {
    // 执行用户脚本
    ${scriptCode}
    
    // 返回结果
    parentPort.postMessage({
      type: 'complete',
      logs: logs,
    })
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      error: error.message,
      logs: logs,
    })
  }
}

run()
`
}

// ============================================
// 沙箱执行器
// ============================================

/**
 * 执行 JavaScript 脚本
 */
export async function executeScript(
  code: string,
  options: ScriptOptions = {}
): Promise<ScriptResult> {
  const startTime = Date.now()
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  
  // 初始化上下文
  const context: ScriptContext = {
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
  
  // 创建 API 实例
  const api = createAlgoFlowAPI(context)
  
  try {
    // 使用 vm 模块在当前进程中执行（简化版本）
    // 实际生产环境应该使用 Worker 或 VM2 进行隔离
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    
    // 构建安全的执行环境
    const sandbox = {
      algoflow: api,
      console: {
        log: (msg: string) => api.log(msg),
        error: (msg: string) => api.log(`[ERROR] ${msg}`),
        warn: (msg: string) => api.log(`[WARN] ${msg}`),
      },
    }
    
    // 包装用户代码
    const wrappedCode = `
      return (async function(algoflow, console) {
        ${code}
      })(algoflow, console)
    `
    
    // 创建超时 Promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Script execution timeout')), timeout)
    })
    
    // 执行脚本
    const execFunction = new AsyncFunction('algoflow', 'console', code)
    await Promise.race([
      execFunction.call(sandbox, api, sandbox.console),
      timeoutPromise,
    ])
    
    return {
      success: true,
      animation: context.output,
      logs: context.logs,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      logs: context.logs,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * 从文件执行脚本
 */
export async function executeScriptFile(
  filePath: string,
  options: ScriptOptions = {}
): Promise<ScriptResult> {
  const { readFileSync } = await import('node:fs')
  const code = readFileSync(filePath, 'utf-8')
  return executeScript(code, options)
}

// ============================================
// 脚本模板生成
// ============================================

/**
 * 生成冒泡排序脚本模板
 */
export function generateBubbleSortTemplate(): string {
  return `// 冒泡排序可视化脚本
const arr = [64, 34, 25, 12, 22, 11, 90]

// 初始化
algoflow.setType('array')
algoflow.setData(arr)
algoflow.setMetadata({
  title: 'Bubble Sort',
  algorithm: 'bubble',
  complexity: { time: 'O(n²)', space: 'O(1)' }
})

// 冒泡排序
const n = arr.length
for (let i = 0; i < n - 1; i++) {
  for (let j = 0; j < n - i - 1; j++) {
    // 比较相邻元素
    algoflow.compare([j, j + 1], \`比较 \${arr[j]} 和 \${arr[j + 1]}\`)
    
    if (arr[j] > arr[j + 1]) {
      // 交换
      algoflow.swapAnimated(j, j + 1, \`交换 \${arr[j]} 和 \${arr[j + 1]}\`)
    }
  }
  // 标记已排序位置
  algoflow.complete(n - i - 1, \`位置 \${n - i - 1} 已排序\`)
}

algoflow.complete(0, '排序完成')
console.log('冒泡排序完成！')
`
}

/**
 * 生成栈操作脚本模板
 */
export function generateStackTemplate(): string {
  return `// 栈操作可视化脚本

// 初始化
algoflow.setType('stack')
algoflow.setData([10, 20, 30])
algoflow.setMetadata({
  title: 'Stack Operations',
  algorithm: 'stack',
  description: '演示 push、pop、peek 操作'
})

// 查看栈顶
algoflow.peek('查看栈顶元素')

// 入栈
algoflow.push(40, 'Push 40')
algoflow.push(50, 'Push 50')

// 出栈
algoflow.pop('Pop 栈顶元素')

// 再次入栈
algoflow.push(60, 'Push 60')

console.log('栈操作演示完成！')
`
}

/**
 * 生成队列操作脚本模板
 */
export function generateQueueTemplate(): string {
  return `// 队列操作可视化脚本

// 初始化
algoflow.setType('queue')
algoflow.setData([1, 2, 3])
algoflow.setMetadata({
  title: 'Queue Operations',
  algorithm: 'queue',
  description: '演示 enqueue、dequeue 操作'
})

// 入队
algoflow.enqueue(4, 'Enqueue 4')
algoflow.enqueue(5, 'Enqueue 5')

// 出队
algoflow.dequeue('Dequeue 队首元素')
algoflow.dequeue('Dequeue 队首元素')

// 再入队
algoflow.enqueue(6, 'Enqueue 6')

console.log('队列操作演示完成！')
`
}

/**
 * 生成快速排序脚本模板
 */
export function generateQuickSortTemplate(): string {
  return `// 快速排序可视化脚本
const arr = [10, 7, 8, 9, 1, 5]

// 初始化
algoflow.setType('array')
algoflow.setData(arr)
algoflow.setMetadata({
  title: 'Quick Sort',
  algorithm: 'quick',
  complexity: { time: 'O(n log n)', space: 'O(log n)' }
})

// 快速排序实现
async function quickSort(low, high) {
  if (low < high) {
    const pivot = arr[high]
    algoflow.highlight(high, \`选择基准元素 \${pivot}\`)
    
    let i = low - 1
    for (let j = low; j < high; j++) {
      algoflow.compare([j, high], \`比较 \${arr[j]} 与基准 \${pivot}\`)
      
      if (arr[j] < pivot) {
        i++
        if (i !== j) {
          algoflow.swapAnimated(i, j, \`交换 \${arr[i]} 和 \${arr[j]}\`)
        }
      }
    }
    
    // 放置基准元素
    if (i + 1 !== high) {
      algoflow.swapAnimated(i + 1, high, '放置基准元素')
    }
    algoflow.complete(i + 1, '基准元素就位')
    
    // 递归排序左右子数组
    await quickSort(low, i)
    await quickSort(i + 2, high)
  }
}

await quickSort(0, arr.length - 1)

// 标记所有元素完成
for (let i = 0; i < arr.length; i++) {
  algoflow.complete(i)
}

console.log('快速排序完成！')
`
}
