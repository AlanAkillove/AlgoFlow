/**
 * Built-in effect definitions
 */

import type { EffectDefinition, EffectConfig, TypewriterConfig, FadeInConfig, SlideInConfig } from './types'

/**
 * Typewriter effect - reveals code/content line by line
 */
export const typewriterEffect: EffectDefinition<TypewriterConfig> = {
  name: 'typewriter',
  defaultConfig: {
    type: 'typewriter',
    duration: 500,
    interval: 80,
    direction: 'down',
    stagger: 'linear'
  },
  cssClass: 'af-typewriter',
  handler: (element, config) => {
    element.classList.add('af-typewriter')
    
    // Set CSS custom properties
    const merged = { ...typewriterEffect.defaultConfig, ...config }
    element.style.setProperty('--af-typewriter-interval', `${merged.interval}ms`)
    element.style.setProperty('--af-typewriter-duration', `${merged.duration}ms`)
    
    // Wrap content in line spans if not already
    const lines = element.querySelectorAll(':scope > *')
    lines.forEach((line, i) => {
      if (!line.classList.contains('af-line')) {
        const span = document.createElement('span')
        span.className = 'af-line'
        span.style.setProperty('--af-line-index', String(i))
        line.parentNode?.insertBefore(span, line)
        span.appendChild(line)
      }
    })
  },
  styles: `
.af-typewriter .af-line {
  opacity: 0;
  transform: translateY(8px);
  animation: af-typewriter-line var(--af-typewriter-duration, 500ms) ease-out forwards;
  animation-delay: calc(var(--af-line-index, 0) * var(--af-typewriter-interval, 80ms) + 100ms);
}

@keyframes af-typewriter-line {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
  `
}

/**
 * Fade in effect
 */
export const fadeInEffect: EffectDefinition<FadeInConfig> = {
  name: 'fadeIn',
  defaultConfig: {
    type: 'fadeIn',
    duration: 600,
    delay: 0
  },
  cssClass: 'af-fade-in',
  handler: (element, config) => {
    element.classList.add('af-fade-in')
    const merged = { ...fadeInEffect.defaultConfig, ...config }
    element.style.setProperty('--af-fade-duration', `${merged.duration}ms`)
    element.style.setProperty('--af-fade-delay', `${merged.delay}ms`)
  },
  styles: `
.af-fade-in {
  opacity: 0;
  animation: af-fade-in var(--af-fade-duration, 600ms) ease-out forwards;
  animation-delay: var(--af-fade-delay, 0ms);
}

@keyframes af-fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
  `
}

/**
 * Slide in effect
 */
export const slideInEffect: EffectDefinition<SlideInConfig> = {
  name: 'slideIn',
  defaultConfig: {
    type: 'slideIn',
    duration: 500,
    direction: 'left',
    distance: 30
  },
  cssClass: 'af-slide-in',
  handler: (element, config) => {
    element.classList.add('af-slide-in')
    const merged = { ...slideInEffect.defaultConfig, ...config }
    element.classList.add(`af-slide-${merged.direction}`)
    element.style.setProperty('--af-slide-distance', `${merged.distance}px`)
    element.style.setProperty('--af-slide-duration', `${merged.duration}ms`)
  },
  styles: `
.af-slide-in {
  opacity: 0;
  animation: af-slide-in var(--af-slide-duration, 500ms) cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.af-slide-in.af-slide-left {
  --af-slide-transform: translateX(calc(-1 * var(--af-slide-distance, 30px)));
}

.af-slide-in.af-slide-right {
  --af-slide-transform: translateX(var(--af-slide-distance, 30px));
}

.af-slide-in.af-slide-top {
  --af-slide-transform: translateY(calc(-1 * var(--af-slide-distance, 30px)));
}

.af-slide-in.af-slide-bottom {
  --af-slide-transform: translateY(var(--af-slide-distance, 30px));
}

@keyframes af-slide-in {
  0% {
    opacity: 0;
    transform: var(--af-slide-transform);
  }
  100% {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
}
  `
}

/**
 * All built-in effects
 */
export const builtInEffects = [
  typewriterEffect,
  fadeInEffect,
  slideInEffect
]

/**
 * Get effect by name
 */
export function getEffect(name: string): EffectDefinition<EffectConfig> | undefined {
  return builtInEffects.find(e => e.name === name) as EffectDefinition<EffectConfig> | undefined
}
