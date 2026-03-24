/**
 * @algoflow/animation
 * 
 * Animation engine for AlgoFlow - handles step-by-step animation playback.
 */

// Player exports
export { AnimationPlayer } from './player/AnimationPlayer'
export { StepQueue } from './player/StepQueue'
export type { AnimationStep, PlayerOptions, PlayerState, PlayerEvent } from './player/types'

// Canvas exports
export { CanvasRenderer } from './canvas/CanvasRenderer'
export type { CanvasOptions, Shape, ShapeStyle, RectShape, CircleShape, LineShape, TextShape, PathShape, AnyShape } from './canvas/types'

// Utility exports
export { EASING_FUNCTIONS, getEasing } from './easing'
