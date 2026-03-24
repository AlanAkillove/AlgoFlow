import { parse as parseSlidev, parseSlide as parseSlidevSlide } from '@slidev/parser'
import type { SlidevMarkdown, SlidevPreparserExtension } from '@slidev/types'
import { componentTagPlugin, componentTagWithContentPlugin } from './component-tag'
import type { ParsedSlide, ParseOptions } from './types'

export { componentTagPlugin, componentTagWithContentPlugin }
export type { ParsedSlide, ParseOptions }

/**
 * Parse a complete Markdown document into slides.
 */
export async function parseMarkdown(
  markdown: string,
  filepath: string,
  options: ParseOptions = {}
): Promise<SlidevMarkdown> {
  const extensions: SlidevPreparserExtension[] = [
    componentTagPlugin,
    componentTagWithContentPlugin,
    ...(options.extensions ?? []),
  ]

  return parseSlidev(markdown, filepath, extensions, options)
}

/**
 * Parse a single slide's content.
 */
export function parseSlide(raw: string): ParsedSlide {
  const result = parseSlidevSlide(raw)
  
  return {
    ...result,
    // Extract component references from content
    components: extractComponents(result.content),
  }
}

/**
 * Extract component names used in slide content.
 */
function extractComponents(content: string): string[] {
  const components = new Set<string>()
  
  // Match self-closing components
  for (const [, name] of content.matchAll(/<([A-Z]\w+)[\s/>]/g)) {
    if (name) components.add(name)
  }
  
  // Match components with content
  for (const [, name] of content.matchAll(/<([A-Z]\w+)[\s>]/g)) {
    if (name) components.add(name)
  }
  
  return Array.from(components)
}
