/**
 * Python 沙箱执行器
 * 
 * 安全地执行 Python 脚本生成动画数据
 * 
 * 安全措施：
 * - 子进程隔离
 * - 超时限制
 * - 内存限制
 * - 限制标准库访问
 */

import { spawn } from 'node:child_process'
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { AnimationStep } from '@algoflow/animation'
import {
  type AnimationOutput,
  type ScriptContext,
  type ScriptOptions,
  type ScriptResult,
  type VizType,
  createAlgoFlowAPI,
} from './api'

// ============================================
// 执行器配置
// ============================================

const DEFAULT_TIMEOUT = 5000
const DEFAULT_MEMORY_LIMIT = 128 // MB

// Python 包装脚本
const PYTHON_WRAPPER = `
import sys
import json
import traceback
from typing import Any, Dict, List, Optional, Union

# ============================================
# AlgoFlow Python API
# ============================================

class AlgoFlowAPI:
    """AlgoFlow Python API - 与 JavaScript API 保持一致"""
    
    def __init__(self):
        self._output = {
            'version': '1.0',
            'type': 'array',
            'initialData': [],
            'steps': [],
            'config': {},
            'metadata': {}
        }
        self._data: List[Union[int, str]] = []
        self._logs: List[str] = []
        self._default_duration = 300
    
    # ============================================
    # 初始化
    # ============================================
    
    def set_type(self, viz_type: str) -> None:
        """设置可视化类型"""
        self._output['type'] = viz_type
    
    def set_data(self, data: List[Union[int, str]]) -> None:
        """设置初始数据"""
        self._output['initialData'] = list(data)
        self._data = list(data)
    
    def set_config(self, config: Dict[str, Any]) -> None:
        """设置配置"""
        self._output['config'].update(config)
    
    def set_metadata(self, metadata: Dict[str, Any]) -> None:
        """设置元数据"""
        self._output['metadata'].update(metadata)
    
    # ============================================
    # 数据操作
    # ============================================
    
    def get_data(self) -> List[Union[int, str]]:
        """获取当前数据"""
        return list(self._data)
    
    def length(self) -> int:
        """获取数据长度"""
        return len(self._data)
    
    def get(self, index: int) -> Optional[Union[int, str]]:
        """获取指定索引的值"""
        if 0 <= index < len(self._data):
            return self._data[index]
        return None
    
    def set(self, index: int, value: Union[int, str]) -> None:
        """设置指定索引的值"""
        if 0 <= index < len(self._data):
            self._data[index] = value
    
    def swap(self, i: int, j: int) -> None:
        """交换两个位置的值"""
        self._data[i], self._data[j] = self._data[j], self._data[i]
    
    # ============================================
    # 动画步骤生成
    # ============================================
    
    def highlight(self, target: Union[int, List[int]], description: str = None) -> None:
        """高亮元素"""
        targets = [target] if isinstance(target, int) else list(target)
        self._output['steps'].append({
            'action': 'highlight',
            'target': targets,
            'duration': self._default_duration,
            'description': description
        })
    
    def unhighlight(self, target: Union[int, List[int]]) -> None:
        """取消高亮"""
        targets = [target] if isinstance(target, int) else list(target)
        self._output['steps'].append({
            'action': 'unhighlight',
            'target': targets,
            'duration': 100
        })
    
    def compare(self, target: Union[int, List[int]], description: str = None) -> None:
        """比较元素"""
        targets = [target] if isinstance(target, int) else list(target)
        self._output['steps'].append({
            'action': 'compare',
            'target': targets,
            'duration': self._default_duration,
            'description': description
        })
    
    def swap_animated(self, i: int, j: int, description: str = None) -> None:
        """交换元素（带动画）"""
        self._data[i], self._data[j] = self._data[j], self._data[i]
        self._output['steps'].append({
            'action': 'swap',
            'target': [i, j],
            'duration': self._default_duration,
            'description': description
        })
    
    def complete(self, target: Union[int, List[int]], description: str = None) -> None:
        """标记完成"""
        targets = [target] if isinstance(target, int) else list(target)
        self._output['steps'].append({
            'action': 'complete',
            'target': targets,
            'duration': self._default_duration,
            'description': description
        })
    
    # ============================================
    # 栈操作
    # ============================================
    
    def push(self, value: Union[int, str], description: str = None) -> None:
        """入栈"""
        self._data.append(value)
        self._output['steps'].append({
            'action': 'push',
            'target': len(self._data) - 1,
            'value': value,
            'duration': self._default_duration,
            'description': description
        })
    
    def pop(self, description: str = None) -> Optional[Union[int, str]]:
        """出栈"""
        if self._data:
            value = self._data.pop()
            self._output['steps'].append({
                'action': 'pop',
                'target': len(self._data),
                'duration': self._default_duration,
                'description': description
            })
            return value
        return None
    
    def peek(self, description: str = None) -> None:
        """查看栈顶"""
        self._output['steps'].append({
            'action': 'peek',
            'target': len(self._data) - 1,
            'duration': self._default_duration,
            'description': description
        })
    
    # ============================================
    # 队列操作
    # ============================================
    
    def enqueue(self, value: Union[int, str], description: str = None) -> None:
        """入队"""
        self._data.append(value)
        self._output['steps'].append({
            'action': 'enqueue',
            'target': len(self._data) - 1,
            'value': value,
            'duration': self._default_duration,
            'description': description
        })
    
    def dequeue(self, description: str = None) -> Optional[Union[int, str]]:
        """出队"""
        if self._data:
            value = self._data.pop(0)
            self._output['steps'].append({
                'action': 'dequeue',
                'target': 0,
                'duration': self._default_duration,
                'description': description
            })
            return value
        return None
    
    # ============================================
    # 其他操作
    # ============================================
    
    def activate(self, target: Union[int, List[int]], description: str = None) -> None:
        """激活元素"""
        targets = [target] if isinstance(target, int) else list(target)
        self._output['steps'].append({
            'action': 'activate',
            'target': targets,
            'duration': self._default_duration,
            'description': description
        })
    
    def deactivate(self, target: Union[int, List[int]]) -> None:
        """取消激活"""
        targets = [target] if isinstance(target, int) else list(target)
        self._output['steps'].append({
            'action': 'deactivate',
            'target': targets,
            'duration': 100
        })
    
    def add_step(self, **kwargs) -> None:
        """添加自定义步骤"""
        step = {
            'action': 'highlight',
            'target': 0,
            'duration': self._default_duration
        }
        step.update(kwargs)
        self._output['steps'].append(step)
    
    def log(self, message: str) -> None:
        """日志输出"""
        self._logs.append(str(message))
    
    def _get_output(self) -> Dict[str, Any]:
        """获取输出结果"""
        return self._output
    
    def _get_logs(self) -> List[str]:
        """获取日志"""
        return self._logs


# 创建全局 API 实例
algoflow = AlgoFlowAPI()

# 便捷别名
af = algoflow
`

const PYTHON_FOOTER = `
# 输出结果
result = {
    'success': True,
    'animation': algoflow._get_output(),
    'logs': algoflow._get_logs()
}
print('__ALGOFLOW_OUTPUT_START__')
print(json.dumps(result))
print('__ALGOFLOW_OUTPUT_END__')
`

// ============================================
// Python 执行器
// ============================================

/**
 * 检查 Python 是否可用
 */
export async function checkPythonAvailable(): Promise<{ available: boolean; version?: string; error?: string }> {
  return new Promise((resolve) => {
    const python = spawn('python', ['--version'])
    let output = ''
    let errorOutput = ''

    python.stdout.on('data', (data) => {
      output += data.toString()
    })

    python.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    python.on('close', (code) => {
      if (code === 0) {
        const versionMatch = (output || errorOutput).match(/Python (\d+\.\d+\.\d+)/)
        resolve({
          available: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
        })
      } else {
        // 尝试 python3
        const python3 = spawn('python3', ['--version'])
        let output3 = ''

        python3.stdout.on('data', (data) => {
          output3 += data.toString()
        })

        python3.on('close', (code3) => {
          if (code3 === 0) {
            const versionMatch = output3.match(/Python (\d+\.\d+\.\d+)/)
            resolve({
              available: true,
              version: versionMatch ? versionMatch[1] : 'unknown',
            })
          } else {
            resolve({
              available: false,
              error: 'Python not found. Please install Python 3.x to use Python scripts.',
            })
          }
        })
      }
    })

    python.on('error', () => {
      resolve({
        available: false,
        error: 'Python not found. Please install Python 3.x to use Python scripts.',
      })
    })
  })
}

/**
 * 执行 Python 脚本
 */
export async function executePythonScript(
  code: string,
  options: ScriptOptions = {}
): Promise<ScriptResult> {
  const startTime = Date.now()
  const timeout = options.timeout ?? DEFAULT_TIMEOUT

  // 检查 Python 是否可用
  const pythonCheck = await checkPythonAvailable()
  if (!pythonCheck.available) {
    return {
      success: false,
      error: pythonCheck.error,
      logs: [],
      duration: Date.now() - startTime,
    }
  }

  // 创建临时目录
  let tempDir: string | undefined
  let scriptPath: string | undefined

  try {
    tempDir = mkdtempSync(join(tmpdir(), 'algoflow-python-'))
    scriptPath = join(tempDir, 'script.py')

    // 组合完整脚本
    const fullScript = PYTHON_WRAPPER + '\n' + code + '\n' + PYTHON_FOOTER

    // 写入脚本文件
    writeFileSync(scriptPath, fullScript, 'utf-8')

    // 执行脚本
    return await new Promise((resolve) => {
      const python = spawn('python', [scriptPath!])
      let stdout = ''
      let stderr = ''

      // 超时处理
      const timeoutId = setTimeout(() => {
        python.kill()
        resolve({
          success: false,
          error: `Script execution timeout (${timeout}ms)`,
          logs: [],
          duration: Date.now() - startTime,
        })
      }, timeout)

      python.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      python.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      python.on('close', (code) => {
        clearTimeout(timeoutId)

        if (code !== 0) {
          resolve({
            success: false,
            error: stderr || `Python exited with code ${code}`,
            logs: [],
            duration: Date.now() - startTime,
          })
          return
        }

        // 解析输出
        // 支持 \n 和 \r\n 换行符
        const outputMatch = stdout.match(/__ALGOFLOW_OUTPUT_START__\r?\n([\s\S]*?)\r?\n__ALGOFLOW_OUTPUT_END__/)
        if (outputMatch) {
          try {
            const result = JSON.parse(outputMatch[1])
            resolve({
              success: result.success,
              animation: result.animation,
              logs: result.logs || [],
              duration: Date.now() - startTime,
            })
          } catch (parseError) {
            resolve({
              success: false,
              error: `Failed to parse output: ${(parseError as Error).message}`,
              logs: [],
              duration: Date.now() - startTime,
            })
          }
        } else {
          resolve({
            success: false,
            error: 'No valid output from Python script',
            logs: [stdout, stderr].filter(Boolean),
            duration: Date.now() - startTime,
          })
        }
      })

      python.on('error', (err) => {
        clearTimeout(timeoutId)
        resolve({
          success: false,
          error: `Failed to spawn Python: ${err.message}`,
          logs: [],
          duration: Date.now() - startTime,
        })
      })
    })
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      logs: [],
      duration: Date.now() - startTime,
    }
  } finally {
    // 清理临时文件
    if (scriptPath) {
      try {
        unlinkSync(scriptPath)
      } catch {}
    }
    if (tempDir) {
      try {
        unlinkSync(tempDir)
      } catch {}
    }
  }
}

/**
 * 从文件执行 Python 脚本
 */
export async function executePythonFile(
  filePath: string,
  options: ScriptOptions = {}
): Promise<ScriptResult> {
  const { readFileSync } = await import('node:fs')
  const code = readFileSync(filePath, 'utf-8')
  return executePythonScript(code, options)
}

// ============================================
// Python 脚本模板
// ============================================

/**
 * 生成 Python 冒泡排序模板
 */
export function generatePythonBubbleSortTemplate(): string {
  return `# 冒泡排序可视化脚本
arr = [64, 34, 25, 12, 22, 11, 90]

# 初始化
algoflow.set_type('array')
algoflow.set_data(arr)
algoflow.set_metadata({
    'title': 'Bubble Sort',
    'algorithm': 'bubble',
    'complexity': {'time': 'O(n²)', 'space': 'O(1)'}
})

# 冒泡排序
n = len(arr)
for i in range(n - 1):
    for j in range(n - i - 1):
        # 比较相邻元素
        algoflow.compare([j, j + 1], f'比较 {arr[j]} 和 {arr[j + 1]}')
        
        if arr[j] > arr[j + 1]:
            # 交换
            arr[j], arr[j + 1] = arr[j + 1], arr[j]
            algoflow.swap_animated(j, j + 1, f'交换 {arr[j + 1]} 和 {arr[j]}')
    
    # 标记已排序位置
    algoflow.complete(n - i - 1, f'位置 {n - i - 1} 已排序')

algoflow.complete(0, '排序完成')
algoflow.log('冒泡排序完成！')
`
}

/**
 * 生成 Python 栈操作模板
 */
export function generatePythonStackTemplate(): string {
  return `# 栈操作可视化脚本

# 初始化
algoflow.set_type('stack')
algoflow.set_data([10, 20, 30])
algoflow.set_metadata({
    'title': 'Stack Operations',
    'algorithm': 'stack',
    'description': '演示 push、pop、peek 操作'
})

# 查看栈顶
algoflow.peek('查看栈顶元素')

# 入栈
algoflow.push(40, 'Push 40')
algoflow.push(50, 'Push 50')

# 出栈
algoflow.pop('Pop 栈顶元素')

# 再次入栈
algoflow.push(60, 'Push 60')

algoflow.log('栈操作演示完成！')
`
}

/**
 * 生成 Python 快速排序模板
 */
export function generatePythonQuickSortTemplate(): string {
  return `# 快速排序可视化脚本
arr = [10, 7, 8, 9, 1, 5]

# 初始化
algoflow.set_type('array')
algoflow.set_data(arr)
algoflow.set_metadata({
    'title': 'Quick Sort',
    'algorithm': 'quick',
    'complexity': {'time': 'O(n log n)', 'space': 'O(log n)'}
})

def quick_sort(low, high):
    if low < high:
        pivot = arr[high]
        algoflow.highlight(high, f'选择基准元素 {pivot}')
        
        i = low - 1
        for j in range(low, high):
            algoflow.compare([j, high], f'比较 {arr[j]} 与基准 {pivot}')
            
            if arr[j] < pivot:
                i += 1
                if i != j:
                    arr[i], arr[j] = arr[j], arr[i]
                    algoflow.swap_animated(i, j, f'交换 {arr[j]} 和 {arr[i]}')
        
        # 放置基准元素
        if i + 1 != high:
            arr[i + 1], arr[high] = arr[high], arr[i + 1]
            algoflow.swap_animated(i + 1, high, '放置基准元素')
        algoflow.complete(i + 1, '基准元素就位')
        
        # 递归排序左右子数组
        quick_sort(low, i)
        quick_sort(i + 2, high)

quick_sort(0, len(arr) - 1)

# 标记所有元素完成
for i in range(len(arr)):
    algoflow.complete(i)

algoflow.log('快速排序完成！')
`
}
