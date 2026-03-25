import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import animationSchema from '../schema/animation.json' assert { type: 'json' }

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

// Type labels for display
const TYPE_LABELS: Record<string, string> = {
  array: 'Array',
  tree: 'Tree',
  graph: 'Graph',
  stack: 'Stack',
  queue: 'Queue',
  heap: 'Heap',
  bst: 'Binary Search Tree',
  sorting: 'Sorting',
}

/**
 * Validate an animation JSON file.
 */
export function validateCommand(file: string, options: { verbose?: boolean }): void {
  const filePath = path.resolve(file)
  
  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(pc.red(`Error: File not found: ${filePath}`))
    process.exit(1)
  }
  
  // Read file
  let content: string
  try {
    content = fs.readFileSync(filePath, 'utf-8')
  } catch (err) {
    console.error(pc.red(`Error: Failed to read file: ${(err as Error).message}`))
    process.exit(1)
  }
  
  // Parse JSON
  let data: unknown
  try {
    data = JSON.parse(content)
  } catch (err) {
    console.error(pc.red(`Error: Invalid JSON: ${(err as Error).message}`))
    process.exit(1)
  }
  
  // Validate against schema
  const validate = ajv.compile(animationSchema)
  const valid = validate(data)
  
  if (valid) {
    console.log(pc.green('✓ Valid animation file'))
    
    // Show summary
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>
      console.log()
      console.log(pc.dim('Summary:'))
      
      const type = obj.type as string
      const typeLabel = TYPE_LABELS[type] || type
      console.log(pc.dim(`  Type: ${pc.cyan(typeLabel)}`))
      console.log(pc.dim(`  Version: ${obj.version}`))
      
      const steps = obj.steps as Array<unknown> | undefined
      if (steps) {
        console.log(pc.dim(`  Steps: ${pc.yellow(steps.length.toString())}`))
      }
      
      const initialData = obj.initialData
      if (Array.isArray(initialData)) {
        console.log(pc.dim(`  Data size: ${pc.yellow(initialData.length.toString())} elements`))
        
        // Show data preview
        if (initialData.length > 0 && options.verbose) {
          const preview = initialData.slice(0, 5).map(v => 
            typeof v === 'string' ? `"${v}"` : v
          ).join(', ')
          const more = initialData.length > 5 ? ', ...' : ''
          console.log(pc.dim(`  Data preview: [${preview}${more}]`))
        }
      } else if (typeof initialData === 'object' && initialData !== null) {
        const dataObj = initialData as Record<string, unknown>
        
        // Tree data
        if (dataObj.value !== undefined) {
          console.log(pc.dim(`  Root value: ${dataObj.value}`))
          const nodeCount = countTreeNodes(dataObj as unknown as TreeNode)
          console.log(pc.dim(`  Node count: ${pc.yellow(nodeCount.toString())}`))
        }
        
        // Graph data
        if (Array.isArray(dataObj.nodes)) {
          console.log(pc.dim(`  Nodes: ${pc.yellow(dataObj.nodes.length.toString())}`))
          if (Array.isArray(dataObj.edges)) {
            console.log(pc.dim(`  Edges: ${pc.yellow(dataObj.edges.length.toString())}`))
          }
        }
      }
      
      // Show config summary
      const config = obj.config as Record<string, unknown> | undefined
      if (config) {
        console.log()
        console.log(pc.dim('Configuration:'))
        
        if (config.speed) {
          console.log(pc.dim(`  Speed: ${config.speed}x`))
        }
        if (config.algorithm) {
          console.log(pc.dim(`  Algorithm: ${pc.cyan(config.algorithm as string)}`))
        }
        if (config.heapType) {
          console.log(pc.dim(`  Heap type: ${pc.cyan(config.heapType as string)}`))
        }
        if (config.orientation) {
          console.log(pc.dim(`  Orientation: ${config.orientation}`))
        }
        if (config.showValues !== undefined) {
          console.log(pc.dim(`  Show values: ${config.showValues ? 'yes' : 'no'}`))
        }
      }
      
      // Show metadata
      const metadata = obj.metadata as Record<string, unknown> | undefined
      if (metadata) {
        console.log()
        console.log(pc.dim('Metadata:'))
        
        if (metadata.title) {
          console.log(pc.dim(`  Title: ${pc.white(metadata.title as string)}`))
        }
        if (metadata.author) {
          console.log(pc.dim(`  Author: ${metadata.author}`))
        }
        if (metadata.algorithm) {
          console.log(pc.dim(`  Algorithm: ${metadata.algorithm}`))
        }
        if (metadata.complexity) {
          const comp = metadata.complexity as { time?: string; space?: string }
          if (comp.time) {
            console.log(pc.dim(`  Time complexity: ${pc.yellow(comp.time)}`))
          }
          if (comp.space) {
            console.log(pc.dim(`  Space complexity: ${pc.yellow(comp.space)}`))
          }
        }
      }
      
      // Show action statistics
      if (steps && steps.length > 0 && options.verbose) {
        const actionCounts = new Map<string, number>()
        steps.forEach(step => {
          if (typeof step === 'object' && step !== null) {
            const action = (step as Record<string, unknown>).action as string
            actionCounts.set(action, (actionCounts.get(action) || 0) + 1)
          }
        })
        
        console.log()
        console.log(pc.dim('Action statistics:'))
        actionCounts.forEach((count, action) => {
          console.log(pc.dim(`  ${action}: ${count}`))
        })
      }
    }
    
    process.exit(0)
  } else {
    console.error(pc.red('✗ Validation failed'))
    console.error()
    
    if (validate.errors) {
      if (options.verbose) {
        console.error(pc.red('Errors:'))
        validate.errors.forEach((err, i) => {
          console.error(pc.red(`  ${i + 1}. ${err.instancePath || '/'} ${err.message}`))
          if (err.params) {
            console.error(pc.dim(`     ${JSON.stringify(err.params)}`))
          }
        })
      } else {
        console.error(pc.red(`Found ${validate.errors.length} error(s).`))
        console.error(pc.dim('Use --verbose for details.'))
      }
    }
    
    process.exit(1)
  }
}

interface TreeNode {
  value: number | string
  id: string
  children?: TreeNode[]
}

function countTreeNodes(node: TreeNode): number {
  let count = 1
  if (node.children) {
    node.children.forEach(child => {
      count += countTreeNodes(child)
    })
  }
  return count
}

/**
 * Validate animation data programmatically.
 */
export function validateAnimation(data: unknown): { valid: boolean; errors?: string[] } {
  const validate = ajv.compile(animationSchema)
  const valid = validate(data)
  
  if (valid) {
    return { valid: true }
  }
  
  const errors = validate.errors?.map((err) =>
    `${err.instancePath || '/'} ${err.message}`
  )
  
  return { valid: false, errors }
}
