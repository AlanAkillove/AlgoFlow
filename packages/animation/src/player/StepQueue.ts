import type { AnimationStep } from './types'

/**
 * Step queue for managing animation steps.
 */
export class StepQueue {
  private steps: AnimationStep[] = []
  private currentIndex: number = 0

  constructor(steps: AnimationStep[] = []) {
    this.steps = [...steps]
  }

  /**
   * Get the total number of steps.
   */
  get length(): number {
    return this.steps.length
  }

  /**
   * Get the current step index.
   */
  get index(): number {
    return this.currentIndex
  }

  /**
   * Check if there are steps in the queue.
   */
  get isEmpty(): boolean {
    return this.steps.length === 0
  }

  /**
   * Check if current position is at the beginning.
   */
  get isAtStart(): boolean {
    return this.currentIndex === 0
  }

  /**
   * Check if current position is at the end.
   */
  get isAtEnd(): boolean {
    return this.currentIndex >= this.steps.length - 1
  }

  /**
   * Get the current step.
   */
  current(): AnimationStep | undefined {
    return this.steps[this.currentIndex]
  }

  /**
   * Get step at specific index.
   */
  get(index: number): AnimationStep | undefined {
    if (index < 0 || index >= this.steps.length) {
      return undefined
    }
    return this.steps[index]
  }

  /**
   * Get all steps.
   */
  getAll(): AnimationStep[] {
    return [...this.steps]
  }

  /**
   * Move to next step and return it.
   */
  next(): AnimationStep | undefined {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++
      return this.current()
    }
    return undefined
  }

  /**
   * Move to previous step and return it.
   */
  prev(): AnimationStep | undefined {
    if (this.currentIndex > 0) {
      this.currentIndex--
      return this.current()
    }
    return undefined
  }

  /**
   * Move to specific index.
   */
  seek(index: number): AnimationStep | undefined {
    if (index < 0 || index >= this.steps.length) {
      return undefined
    }
    this.currentIndex = index
    return this.current()
  }

  /**
   * Reset to beginning.
   */
  reset(): void {
    this.currentIndex = 0
  }

  /**
   * Add step(s) to the end of queue.
   */
  push(...steps: AnimationStep[]): number {
    return this.steps.push(...steps)
  }

  /**
   * Clear all steps.
   */
  clear(): void {
    this.steps = []
    this.currentIndex = 0
  }

  /**
   * Replace all steps.
   */
  setSteps(steps: AnimationStep[]): void {
    this.steps = [...steps]
    this.currentIndex = 0
  }

  /**
   * Iterate over all steps.
   */
  [Symbol.iterator](): Iterator<AnimationStep> {
    let index = 0
    const steps = this.steps
    return {
      next(): IteratorResult<AnimationStep> {
        if (index < steps.length) {
          return { value: steps[index++], done: false }
        }
        return { value: undefined, done: true }
      },
    }
  }
}
