/**
 * Effect directive parser for markdown comments
 */

import type { ParsedDirective } from './types'

const DIRECTIVE_REGEX = /<!--\s*(\w+)\s*(:?\s*(.+?))?\s*-->/g
const TIME_VALUE_REGEX = /^(\d+(?:\.\d+)?)(ms|s)?$/
const JSON_OBJECT_REGEX = /^\{[\s\S]*\}$/

function parseTimeValue(value: string): number {
  const match = value.match(TIME_VALUE_REGEX)
  if (!match) return 0
  const num = parseFloat(match[1])
  const unit = match[2] || 'ms'
  return unit === 's' ? num * 1000 : num
}

function parseArgument(arg: string): Record<string, unknown> {
  const trimmed = arg.trim()
  if (!trimmed) return {}
  if (TIME_VALUE_REGEX.test(trimmed)) {
    return { duration: parseTimeValue(trimmed) }
  }
  if (JSON_OBJECT_REGEX.test(trimmed)) {
    try {
      const jsonStr = trimmed.replace(/(\w+)\s*:/g, '" \:')
 return JSON.parse(jsonStr)
 } catch {
 return {}
 }
 }
 return { value: trimmed }
}

export function parseDirectives(content: string): ParsedDirective[] {
 const directives: ParsedDirective[] = []
 let match: RegExpExecArray | null
 while ((match = DIRECTIVE_REGEX.exec(content)) !== null) {
 const name = match[1]
 const arg = match[3] || ''
 if (isEffectName(name)) {
 directives.push({
 name,
 config: parseArgument(arg),
 raw: match[0],
 line: content.substring(0, match.index).split('\n').length
 })
 }
 }
 return directives
}

const EFFECT_NAMES = new Set([
 'typewriter', 'fadeIn', 'fadein', 'slideIn', 'slidein',
 'scaleIn', 'scalein', 'blurIn', 'blurin', 'effect'
])

function isEffectName(name: string): boolean {
 return EFFECT_NAMES.has(name) || name.startsWith('effect:')
}

export function findDirectiveForBlock(content: string, blockStartLine: number): ParsedDirective | null {
 const lines = content.split('\n')
 for (let i = blockStartLine - 1; i >= 0; i--) {
 const line = lines[i].trim()
 if (line === '') continue
 const match = line.match(DIRECTIVE_REGEX)
 if (match && isEffectName(match[1])) {
 return {
 name: match[1],
 config: parseArgument(match[3] || ''),
 raw: match[0],
 line: i + 1
 }
 }
 break
 }
 return null
}

export function applyDirectiveConfig(element: HTMLElement, directive: ParsedDirective): void {
 const { name, config } = directive
 element.classList.add('af-effect-' + name)
 if (config.duration) element.style.setProperty('--af-duration', config.duration + 'ms')
 if (config.delay) element.style.setProperty('--af-delay', config.delay + 'ms')
 if (config.interval) element.style.setProperty('--af-interval', config.interval + 'ms')
 if (config.easing) element.style.setProperty('--af-easing', config.easing as string)
}

export function removeDirectiveComments(content: string): string {
 return content.replace(DIRECTIVE_REGEX, '').replace(/\n\s*\n\s*\n/g, '\n\n')
}

export { DIRECTIVE_REGEX }
