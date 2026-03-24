import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import Ajv from 'ajv'
import animationSchema from '../schema/animation.json' assert { type: 'json' }

const ajv = new Ajv({ allErrors: true })

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
      console.log(pc.dim(`  Type: ${obj.type}`))
      console.log(pc.dim(`  Version: ${obj.version}`))
      
      const steps = obj.steps as Array<unknown> | undefined
      if (steps) {
        console.log(pc.dim(`  Steps: ${steps.length}`))
      }
      
      const initialData = obj.initialData
      if (Array.isArray(initialData)) {
        console.log(pc.dim(`  Data size: ${initialData.length}`))
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
