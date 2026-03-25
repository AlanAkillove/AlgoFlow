import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import { 
  executeScript, 
  executeScriptFile,
  generateBubbleSortTemplate,
  generateStackTemplate,
  generateQueueTemplate,
  generateQuickSortTemplate,
} from '../script/executor'
import {
  executePythonScript,
  executePythonFile,
  checkPythonAvailable,
  generatePythonBubbleSortTemplate,
  generatePythonStackTemplate,
  generatePythonQuickSortTemplate,
} from '../script/python-executor'
import type { ScriptOptions, ScriptResult } from '../script/api'

/**
 * 根据文件扩展名获取执行器
 */
function getExecutor(filePath: string): {
  type: 'javascript' | 'python'
  execute: (code: string, options?: ScriptOptions) => Promise<ScriptResult>
  executeFile: (filePath: string, options?: ScriptOptions) => Promise<ScriptResult>
} {
  const ext = path.extname(filePath).toLowerCase()
  
  if (ext === '.py') {
    return {
      type: 'python',
      execute: executePythonScript,
      executeFile: executePythonFile,
    }
  }
  
  return {
    type: 'javascript',
    execute: executeScript,
    executeFile: executeScriptFile,
  }
}

/**
 * 执行脚本命令
 */
export async function execCommand(
  file: string, 
  options: { 
    output?: string
    timeout?: number
    verbose?: boolean
    template?: string
  }
): Promise<void> {
  const filePath = path.resolve(file)
  
  // 处理模板生成
  if (options.template) {
    // JavaScript 模板
    const jsTemplates: Record<string, () => string> = {
      bubble: generateBubbleSortTemplate,
      stack: generateStackTemplate,
      queue: generateQueueTemplate,
      quick: generateQuickSortTemplate,
    }
    
    // Python 模板
    const pyTemplates: Record<string, () => string> = {
      'py-bubble': generatePythonBubbleSortTemplate,
      'py-stack': generatePythonStackTemplate,
      'py-quick': generatePythonQuickSortTemplate,
    }
    
    const allTemplates = { ...jsTemplates, ...pyTemplates }
    const generator = allTemplates[options.template]
    
    if (!generator) {
      console.error(pc.red(`Unknown template: ${options.template}`))
      console.log(pc.dim('JavaScript templates: bubble, stack, queue, quick'))
      console.log(pc.dim('Python templates: py-bubble, py-stack, py-quick'))
      process.exit(1)
    }
    
    const code = generator()
    
    if (options.output) {
      const outputPath = path.resolve(options.output)
      fs.writeFileSync(outputPath, code)
      console.log(pc.green(`✓ Template saved to ${outputPath}`))
    } else {
      console.log(code)
    }
    return
  }
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.error(pc.red(`Error: File not found: ${filePath}`))
    process.exit(1)
  }
  
  // 获取执行器
  const executor = getExecutor(filePath)
  
  // 如果是 Python，先检查 Python 是否可用
  if (executor.type === 'python') {
    const pythonCheck = await checkPythonAvailable()
    if (!pythonCheck.available) {
      console.error(pc.red(`Error: ${pythonCheck.error}`))
      process.exit(1)
    }
    if (options.verbose) {
      console.log(pc.dim(`Python version: ${pythonCheck.version}`))
    }
  }
  
  console.log(pc.dim(`Executing ${executor.type} script: ${filePath}`))
  console.log()
  
  // 执行脚本
  const scriptOptions: ScriptOptions = {
    timeout: options.timeout ?? 5000,
  }
  
  const result = await executor.executeFile(filePath, scriptOptions)
  
  if (result.success && result.animation) {
    console.log(pc.green('✓ Script executed successfully'))
    console.log()
    
    // 显示执行信息
    if (options.verbose) {
      console.log(pc.dim('Execution Info:'))
      console.log(pc.dim(`  Duration: ${result.duration}ms`))
      console.log(pc.dim(`  Steps generated: ${result.animation.steps?.length ?? 0}`))
      console.log()
    }
    
    // 显示生成的动画信息
    const anim = result.animation
    console.log(pc.dim('Generated Animation:'))
    console.log(pc.dim(`  Type: ${pc.cyan(anim.type)}`))
    
    if (Array.isArray(anim.initialData)) {
      console.log(pc.dim(`  Data size: ${anim.initialData.length} elements`))
      if (options.verbose && anim.initialData.length > 0) {
        const preview = anim.initialData.slice(0, 5).join(', ')
        const more = anim.initialData.length > 5 ? ', ...' : ''
        console.log(pc.dim(`  Data: [${preview}${more}]`))
      }
    }
    
    if (anim.steps) {
      console.log(pc.dim(`  Steps: ${pc.yellow(anim.steps.length.toString())}`))
    }
    
    if (anim.metadata) {
      console.log()
      console.log(pc.dim('Metadata:'))
      if (anim.metadata.title) {
        console.log(pc.dim(`  Title: ${anim.metadata.title}`))
      }
      if (anim.metadata.algorithm) {
        console.log(pc.dim(`  Algorithm: ${anim.metadata.algorithm}`))
      }
      if (anim.metadata.complexity) {
        if (anim.metadata.complexity.time) {
          console.log(pc.dim(`  Time: ${anim.metadata.complexity.time}`))
        }
        if (anim.metadata.complexity.space) {
          console.log(pc.dim(`  Space: ${anim.metadata.complexity.space}`))
        }
      }
    }
    
    // 显示日志
    if (result.logs.length > 0) {
      console.log()
      console.log(pc.dim('Console Output:'))
      result.logs.forEach(log => {
        console.log(pc.dim(`  ${log}`))
      })
    }
    
    // 输出到文件
    const outputPath = options.output
    if (outputPath) {
      const json = JSON.stringify(anim, null, 2)
      fs.writeFileSync(outputPath, json)
      console.log()
      console.log(pc.green(`✓ Animation saved to ${outputPath}`))
    } else {
      // 默认输出到同目录下的 .json 文件
      const defaultOutput = filePath.replace(/\.(js|ts|py)$/, '.json')
      const json = JSON.stringify(anim, null, 2)
      fs.writeFileSync(defaultOutput, json)
      console.log()
      console.log(pc.green(`✓ Animation saved to ${defaultOutput}`))
    }
    
  } else {
    console.error(pc.red('✗ Script execution failed'))
    
    if (result.error) {
      console.error(pc.red(`Error: ${result.error}`))
    }
    
    if (result.logs.length > 0) {
      console.log()
      console.log(pc.dim('Console Output:'))
      result.logs.forEach(log => {
        console.log(pc.dim(`  ${log}`))
      })
    }
    
    process.exit(1)
  }
}

/**
 * 显示帮助信息
 */
export function showTemplatesHelp(): void {
  console.log('Available script templates:')
  console.log()
  console.log('JavaScript:')
  console.log('  bubble  - Bubble Sort algorithm')
  console.log('  stack   - Stack operations (push/pop/peek)')
  console.log('  queue   - Queue operations (enqueue/dequeue)')
  console.log('  quick   - Quick Sort algorithm')
  console.log()
  console.log('Python:')
  console.log('  py-bubble - Bubble Sort algorithm')
  console.log('  py-stack  - Stack operations')
  console.log('  py-quick  - Quick Sort algorithm')
  console.log()
  console.log('Usage:')
  console.log('  algoflow exec --template bubble -o bubble-sort.js')
  console.log('  algoflow exec --template py-bubble -o bubble-sort.py')
  console.log('  algoflow exec script.js -o animation.json')
  console.log('  algoflow exec script.py -o animation.json')
}
