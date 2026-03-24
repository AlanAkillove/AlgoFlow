import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'

interface EmbedOptions {
  md: string
  animation: string
  tag: string
  output?: string
}

/**
 * Embed animation JSON into a Markdown file.
 */
export function embedCommand(options: EmbedOptions): void {
  const mdPath = path.resolve(options.md)
  const animationPath = path.resolve(options.animation)
  const outputPath = options.output ? path.resolve(options.output) : mdPath
  
  // Check files exist
  if (!fs.existsSync(mdPath)) {
    console.error(pc.red(`Error: Markdown file not found: ${mdPath}`))
    process.exit(1)
  }
  
  if (!fs.existsSync(animationPath)) {
    console.error(pc.red(`Error: Animation file not found: ${animationPath}`))
    process.exit(1)
  }
  
  // Read files
  let mdContent: string
  let animationContent: string
  
  try {
    mdContent = fs.readFileSync(mdPath, 'utf-8')
    animationContent = fs.readFileSync(animationPath, 'utf-8')
  } catch (err) {
    console.error(pc.red(`Error: Failed to read files: ${(err as Error).message}`))
    process.exit(1)
  }
  
  // Parse animation JSON to validate
  let animationData: unknown
  try {
    animationData = JSON.parse(animationContent)
  } catch (err) {
    console.error(pc.red(`Error: Invalid animation JSON: ${(err as Error).message}`))
    process.exit(1)
  }
  
  // Find and replace the tag
  const tagRegex = new RegExp(escapeRegExp(options.tag), 'g')
  const matches = mdContent.match(tagRegex)
  
  if (!matches) {
    console.error(pc.yellow(`Warning: Tag "${options.tag}" not found in Markdown file`))
    process.exit(0)
  }
  
  // Create the replacement component with embedded data
  const componentName = extractComponentName(options.tag)
  const replacement = createComponentWithAnimation(componentName, animationData)
  
  // Replace first occurrence (or all if flag is set)
  const newContent = mdContent.replace(tagRegex, replacement)
  
  // Write output
  try {
    fs.writeFileSync(outputPath, newContent, 'utf-8')
    console.log(pc.green(`✓ Embedded animation into ${outputPath}`))
    console.log(pc.dim(`  Replaced ${matches.length} occurrence(s) of "${options.tag}"`))
  } catch (err) {
    console.error(pc.red(`Error: Failed to write file: ${(err as Error).message}`))
    process.exit(1)
  }
}

/**
 * Escape special regex characters.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extract component name from tag.
 */
function extractComponentName(tag: string): string {
  const match = tag.match(/<(\w+)/)
  return match ? match[1] : 'ArrayViz'
}

/**
 * Create Vue component with embedded animation data.
 */
function createComponentWithAnimation(componentName: string, data: unknown): string {
  // Create a more readable format
  return `<${componentName}
  :data="${escapeHtmlAttr(JSON.stringify((data as { initialData: number[] }).initialData))}"
  :steps='${JSON.stringify((data as { steps: unknown[] }).steps)}'
/>`
}

/**
 * Escape HTML attribute value.
 */
function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
