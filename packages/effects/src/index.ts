/**
 * @algoflow/effects
 * 
 * Animation effects system for AlgoFlow presentations
 * 
 * ## Usage in Markdown
 * 
 * ```md
 * <!-- typewriter -->
 * \`\`\`typescript
 * const greeting = "Hello, World!"
 * console.log(greeting)
 * \`\`\`
 * 
 * <!-- fadeIn: 300ms -->
 * This paragraph will fade in over 300ms.
 * 
 * <!-- slideIn: { direction: 'left', distance: 50 } -->
 * ## This heading slides in from the left
 * ```
 */

export * from './types'
export * from './parser'
export * from './effects'

import type { EffectDefinition, EffectConfig } from './types'
import { builtInEffects } from './effects'

/**
 * Effect registry - can be extended with custom effects
 */
const effectRegistry = new Map<string, EffectDefinition<EffectConfig>>()

// Register built-in effects
builtInEffects.forEach(effect => {
  effectRegistry.set(effect.name, effect as EffectDefinition<EffectConfig>)
})

/**
 * Register a custom effect
 */
export function registerEffect(effect: EffectDefinition): void {
  effectRegistry.set(effect.name, effect)
}

/**
 * Get all registered effects
 */
export function getRegisteredEffects(): Map<string, EffectDefinition> {
  return effectRegistry
}

/**
 * Apply an effect to an element
 */
export function applyEffect(
  element: HTMLElement,
  effectName: string,
  config?: Partial<EffectConfig>
): void {
  const effect = effectRegistry.get(effectName)
  if (!effect) {
    console.warn(`Effect "${effectName}" not found`)
    return
  }
  
  const mergedConfig = { ...effect.defaultConfig, ...config } as EffectConfig
  effect.handler(element, mergedConfig)
}

/**
 * Get all effect CSS styles
 */
export function getAllEffectStyles(): string {
  return Array.from(effectRegistry.values())
    .map(e => e.styles || '')
    .join('\n')
}
