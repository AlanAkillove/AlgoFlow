/**
 * Supported action types for animations.
 */
export type ActionType =
  | 'highlight'    // Highlight element(s)
  | 'unhighlight'  // Remove highlight
  | 'swap'         // Swap two elements (array)
  | 'move'         // Move element to position
  | 'setValue'     // Change element value
  | 'focus'        // Focus/zoom on element
  | 'traverse'     // Traverse edge/path
  | 'compare'      // Compare two elements
  | 'complete'     // Mark element as complete/sorted

/**
 * Target for animation - single index or array of indices.
 */
export type StepTarget = number | number[]

/**
 * Single animation step definition.
 */
export interface AnimationStep {
  /** Type of action to perform */
  readonly action: ActionType
  /** Target element index or indices */
  readonly target: StepTarget
  /** New value (for setValue action) */
  readonly value?: unknown
  /** Animation duration in milliseconds */
  duration: number
  /** Easing function name */
  easing?: string
  /** Delay before animation starts */
  delay?: number
  /** Optional description for debugging */
  description?: string
}

/**
 * Animation player configuration options.
 */
export interface PlayerOptions {
  /** Array of animation steps to execute */
  steps: AnimationStep[]
  /** Playback speed multiplier (default: 1) */
  speed?: number
  /** Whether to start playing immediately (default: false) */
  autoPlay?: boolean
  /** Loop animation when complete (default: false) */
  loop?: boolean
}

/**
 * Current state of the animation player.
 */
export interface PlayerState {
  /** Whether the player is currently playing */
  isPlaying: boolean
  /** Whether the player is paused */
  isPaused: boolean
  /** Current step index */
  currentIndex: number
  /** Total number of steps */
  totalSteps: number
  /** Current playback speed */
  speed: number
  /** Whether animation has completed */
  isComplete: boolean
}

/**
 * Event types emitted by the player.
 */
export type PlayerEvent = 'step' | 'complete' | 'reset' | 'play' | 'pause' | 'speedChange'

/**
 * Event callback function type.
 */
export type EventCallback<T = unknown> = (data: T) => void

/**
 * Event map for type-safe event handling.
 */
export interface PlayerEventMap {
  step: { index: number; step: AnimationStep }
  complete: void
  reset: void
  play: void
  pause: void
  speedChange: { oldSpeed: number; newSpeed: number }
}
