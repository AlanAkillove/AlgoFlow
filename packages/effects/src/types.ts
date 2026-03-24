/**
 * Animation effect types for AlgoFlow
 */

/**
 * Base effect configuration
 */
export interface EffectConfig {
  /** Effect type identifier */
  type: string
  /** Enable/disable the effect */
  enabled?: boolean
  /** Animation duration in milliseconds */
  duration?: number
  /** Delay before animation starts */
  delay?: number
  /** Easing function */
  easing?: string
}

/**
 * Typewriter effect - reveals content line by line
 * 
 * Usage in markdown:
 * ```md
 * <!-- typewriter -->
 * <!-- typewriter: 100ms -->
 * <!-- typewriter: { duration: 500, delay: 100, interval: 80 } -->
 * ```
 */
export interface TypewriterConfig extends EffectConfig {
  type: 'typewriter'
  /** Interval between each line reveal (default: 80ms) */
  interval?: number
  /** Direction of reveal: 'down' | 'up' | 'random' */
  direction?: 'down' | 'up' | 'random'
  /** Stagger pattern: 'linear' | 'ease' | 'exponential' */
  stagger?: 'linear' | 'ease' | 'exponential'
}

/**
 * Fade in effect - gradually reveals content
 * 
 * Usage in markdown:
 * ```md
 * <!-- fadeIn -->
 * <!-- fadeIn: 300ms -->
 * <!-- fadeIn: { duration: 500, delay: 200 } -->
 * ```
 */
export interface FadeInConfig extends EffectConfig {
  type: 'fadeIn'
}

/**
 * Slide in effect - slides content from a direction
 * 
 * Usage in markdown:
 * ```md
 * <!-- slideIn -->
 * <!-- slideIn: left -->
 * <!-- slideIn: { direction: 'right', distance: 50 } -->
 * ```
 */
export interface SlideInConfig extends EffectConfig {
  type: 'slideIn'
  /** Direction to slide from */
  direction?: 'left' | 'right' | 'top' | 'bottom'
  /** Distance in pixels */
  distance?: number
}

/**
 * Scale in effect - scales content from small to normal
 */
export interface ScaleInConfig extends EffectConfig {
  type: 'scaleIn'
  /** Starting scale (default: 0.8) */
  from?: number
  /** Ending scale (default: 1) */
  to?: number
}

/**
 * Blur in effect - reveals content from blurred state
 */
export interface BlurInConfig extends EffectConfig {
  type: 'blurIn'
  /** Starting blur in pixels (default: 10) */
  blur?: number
}

/**
 * Union type of all effect configurations
 */
export type AnyEffectConfig = 
  | TypewriterConfig 
  | FadeInConfig 
  | SlideInConfig 
  | ScaleInConfig 
  | BlurInConfig

/**
 * Parsed directive from markdown
 */
export interface ParsedDirective {
  /** Directive name (e.g., 'typewriter', 'fadeIn') */
  name: string
  /** Parsed configuration */
  config: Record<string, unknown>
  /** Original comment text */
  raw: string
  /** Line number in source */
  line?: number
}

/**
 * Effect handler function type
 */
export type EffectHandler<T extends EffectConfig = EffectConfig> = (
  element: HTMLElement,
  config: T
) => void | Promise<void>

/**
 * Effect definition
 */
export interface EffectDefinition<T extends EffectConfig = EffectConfig> {
  name: string
  defaultConfig: Partial<T>
  handler: EffectHandler<T>
  cssClass: string
  styles?: string
}
