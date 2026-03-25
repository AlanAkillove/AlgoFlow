import anime from 'animejs'
import { StepQueue } from './StepQueue'
import type {
  AnimationStep,
  PlayerOptions,
  PlayerState,
  PlayerEvent,
  EventCallback,
  PlayerEventMap,
} from './types'

/**
 * Animation player for controlling step-by-step animations.
 * 
 * @example
 * ```ts
 * const player = new AnimationPlayer({
 *   steps: [
 *     { action: 'highlight', target: 0, duration: 500 },
 *     { action: 'swap', target: [0, 1], duration: 300 },
 *   ],
 * })
 * player.play()
 * ```
 */
export class AnimationPlayer {
  private queue: StepQueue
  private isPlaying: boolean = false
  private isPaused: boolean = false
  private speed: number = 1
  private loop: boolean = false
  private currentAnimation: anime.AnimeInstance | null = null
  private eventListeners: Map<PlayerEvent, Set<EventCallback<unknown>>> = new Map()

  constructor(options: PlayerOptions) {
    this.queue = new StepQueue(options.steps)
    this.speed = options.speed ?? 1
    this.loop = options.loop ?? false

    if (options.autoPlay) {
      this.play()
    }
  }

  /**
   * Get current player state.
   */
  get state(): PlayerState {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.queue.index,
      totalSteps: this.queue.length,
      speed: this.speed,
      isComplete: this.queue.isAtEnd && !this.isPlaying,
    }
  }

  /**
   * Get current step index.
   */
  get currentIndex(): number {
    return this.queue.index
  }

  /**
   * Get total number of steps.
   */
  get totalSteps(): number {
    return this.queue.length
  }

  /**
   * Start or resume playback.
   */
  async play(): Promise<void> {
    if (this.isPlaying && !this.isPaused) return

    this.isPlaying = true
    this.isPaused = false
    this.emit('play')

    await this.runAnimation()
  }

  /**
   * Pause playback.
   */
  pause(): void {
    if (!this.isPlaying) return

    this.isPaused = true
    if (this.currentAnimation) {
      this.currentAnimation.pause()
    }
    this.emit('pause')
  }

  /**
   * Resume paused playback.
   */
  resume(): void {
    if (!this.isPaused) return

    this.isPaused = false
    if (this.currentAnimation) {
      this.currentAnimation.play()
    }
    this.emit('play')
  }

  /**
   * Move to next step manually.
   */
  async next(): Promise<AnimationStep | undefined> {
    const step = this.queue.next()
    if (step) {
      await this.executeStep(step)
      this.emit('step', { index: this.queue.index, step })
    }
    return step
  }

  /**
   * Move to previous step manually.
   */
  async prev(): Promise<AnimationStep | undefined> {
    const step = this.queue.prev()
    if (step) {
      await this.executeStep(step)
      this.emit('step', { index: this.queue.index, step })
    }
    return step
  }

  /**
   * Jump to specific step index.
   */
  seek(index: number): void {
    const step = this.queue.seek(index)
    if (step) {
      this.emit('step', { index, step })
    }
  }

  /**
   * Set playback speed.
   */
  setSpeed(speed: number): void {
    if (speed <= 0) return

    const oldSpeed = this.speed
    this.speed = speed
    this.emit('speedChange', { oldSpeed, newSpeed: speed })
  }

  /**
   * Reset to beginning.
   */
  reset(): void {
    this.isPlaying = false
    this.isPaused = false
    this.queue.reset()
    this.currentAnimation = null
    this.emit('reset')
  }

  /**
   * Destroy the player and free resources.
   */
  destroy(): void {
    // Stop any running animation
    if (this.currentAnimation) {
      this.currentAnimation.pause()
      this.currentAnimation = null
    }
    
    // Clear state
    this.isPlaying = false
    this.isPaused = false
    this.queue.reset()
    
    // Clear all event listeners
    this.eventListeners.clear()
  }

  /**
   * Replace all steps.
   */
  setSteps(steps: AnimationStep[]): void {
    this.queue.setSteps(steps)
    this.reset()
  }

  /**
   * Register event listener.
   */
  on<K extends PlayerEvent>(event: K, callback: EventCallback<PlayerEventMap[K]>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback as EventCallback<unknown>)
  }

  /**
   * Remove event listener.
   */
  off<K extends PlayerEvent>(event: K, callback: EventCallback<PlayerEventMap[K]>): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback as EventCallback<unknown>)
    }
  }

  /**
   * Run continuous animation loop.
   */
  private async runAnimation(): Promise<void> {
    while (this.isPlaying && !this.isPaused) {
      const step = this.queue.current()
      
      if (!step) {
        // Animation complete
        if (this.loop) {
          this.queue.reset()
          continue
        }
        this.isPlaying = false
        this.emit('complete')
        break
      }

      await this.executeStep(step)
      this.emit('step', { index: this.queue.index, step })

      // Move to next step
      if (!this.queue.next()) {
        // Reached end
        if (this.loop) {
          this.queue.reset()
          continue
        }
        this.isPlaying = false
        this.emit('complete')
        break
      }
    }
  }

  /**
   * Execute a single animation step.
   */
  private executeStep(step: AnimationStep): Promise<void> {
    return new Promise((resolve) => {
      const duration = step.duration ?? 300
      const adjustedDuration = duration / this.speed

      this.currentAnimation = anime({
        targets: {},
        duration: adjustedDuration,
        easing: step.easing ?? 'easeOutQuad',
        delay: (step.delay ?? 0) / this.speed,
        complete: () => {
          this.currentAnimation = null
          resolve()
        },
        // Placeholder targets - actual animation handled by visualization component
      })

      // If duration is 0, resolve immediately
      if (adjustedDuration === 0 && (step.delay ?? 0) === 0) {
        this.currentAnimation = null
        resolve()
      }
    })
  }

  /**
   * Emit an event.
   */
  private emit<K extends PlayerEvent>(event: K, data?: PlayerEventMap[K]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }
}
