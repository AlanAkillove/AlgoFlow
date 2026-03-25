<template>
  <div ref="containerRef" class="stack-viz">
    <!-- Step description display -->
    <Transition name="fade">
      <div v-if="currentDescription" class="step-description">
        {{ currentDescription }}
      </div>
    </Transition>
    
    <!-- Stack info display -->
    <div class="stack-info">
      <span class="stack-label">Stack</span>
      <span class="stack-size">Size: {{ currentData.length }}</span>
    </div>
    
    <div ref="canvasContainerRef" class="canvas-container">
      <canvas ref="canvasRef" class="stack-canvas" />
    </div>
    
    <PlayerControls
      v-if="steps.length > 0"
      class="controls"
      :is-playing="playerState.isPlaying"
      :current-index="playerState.currentIndex"
      :total-steps="playerState.totalSteps"
      :speed="playerState.speed"
      :can-prev="playerState.currentIndex > 0"
      :can-next="playerState.currentIndex < playerState.totalSteps - 1"
      @play="handlePlay"
      @pause="handlePause"
      @prev="handlePrev"
      @next="handleNext"
      @reset="handleReset"
      @speed-change="handleSpeedChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { AnimationPlayer, CanvasRenderer } from '@algoflow/animation'
import type { AnimationStep } from '@algoflow/animation'
import { 
  type VisualizationConfig, 
  type VisualizationColors,
  COLOR_THEMES 
} from '../types'
import PlayerControls from './PlayerControls.vue'

// Props
const props = withDefaults(defineProps<{
  data: (number | string)[]
  steps?: AnimationStep[]
  stepIndex?: number
  config?: VisualizationConfig
  itemHeight?: number
  itemWidth?: number
  showValues?: boolean
  maxVisibleItems?: number
}>(), {
  steps: () => [],
  stepIndex: 0,
  itemHeight: 40,
  itemWidth: 80,
  showValues: true,
  maxVisibleItems: 10,
})

// Events
const emit = defineEmits<{
  step: [index: number, step: AnimationStep]
  complete: []
  reset: []
  error: [error: Error]
}>()

// Refs
const containerRef = ref<HTMLDivElement>()
const canvasContainerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()

// Renderer and player
let renderer: CanvasRenderer | null = null
let resizeObserver: ResizeObserver | null = null
const player = ref<AnimationPlayer | null>(null)

// Player state
const playerState = reactive({
  isPlaying: false,
  currentIndex: 0,
  totalSteps: 0,
  speed: 1,
})

// Data state
const currentData = ref<(number | string)[]>([...props.data])

// Element states
type ElementState = 'default' | 'highlighted' | 'active' | 'peeking' | 'pushing' | 'popping'
const elementStates = ref<Map<number, ElementState>>(new Map())

// Animation states for visual effects
const animatingElements = ref<Map<number, { y: number; opacity: number }>>(new Map())

// Current step description
const currentDescription = ref<string>('')

// Computed colors from config
const colors = computed<Required<VisualizationColors>>(() => ({
  primary: props.config?.colors?.primary ?? COLOR_THEMES.default.primary!,
  highlight: props.config?.colors?.highlight ?? COLOR_THEMES.default.highlight!,
  comparing: props.config?.colors?.comparing ?? COLOR_THEMES.default.comparing!,
  complete: props.config?.colors?.complete ?? COLOR_THEMES.default.complete!,
  active: props.config?.colors?.active ?? COLOR_THEMES.default.active!,
  error: props.config?.colors?.error ?? COLOR_THEMES.default.error!,
  background: props.config?.colors?.background ?? 'transparent',
  text: props.config?.colors?.text ?? '#ffffff',
  border: props.config?.colors?.border ?? 'rgba(255, 255, 255, 0.2)',
}))

// Get color for element based on state
function getElementColor(index: number): string {
  const state = elementStates.value.get(index)
  switch (state) {
    case 'highlighted':
      return colors.value.highlight
    case 'active':
    case 'pushing':
      return colors.value.active
    case 'peeking':
      return colors.value.comparing
    case 'popping':
      return colors.value.error
    default:
      return colors.value.primary
  }
}

// Initialize player
function initPlayer(): void {
  if (props.steps.length === 0) return

  player.value = new AnimationPlayer({
    steps: props.steps,
    speed: props.config?.speed ?? 1,
  })

  playerState.speed = props.config?.speed ?? 1
  playerState.totalSteps = props.steps.length
  playerState.currentIndex = 0
  playerState.isPlaying = false

  player.value.on('step', ({ index, step }: { index: number; step: AnimationStep }) => {
    playerState.currentIndex = index
    applyStep(step)
    emit('step', index, step)
    render()
  })

  player.value.on('play', () => {
    playerState.isPlaying = true
  })

  player.value.on('pause', () => {
    playerState.isPlaying = false
  })

  player.value.on('complete', () => {
    playerState.isPlaying = false
    currentDescription.value = ''
    emit('complete')
  })

  player.value.on('reset', () => {
    playerState.currentIndex = 0
    playerState.isPlaying = false
    currentDescription.value = ''
    emit('reset')
  })
}

// Control handlers
function handlePlay(): void {
  player.value?.play()
  playerState.isPlaying = true
}

function handlePause(): void {
  player.value?.pause()
  playerState.isPlaying = false
}

async function handlePrev(): Promise<void> {
  if (playerState.currentIndex > 0) {
    resetState()
    
    const targetIndex = playerState.currentIndex - 1
    for (let i = 0; i <= targetIndex; i++) {
      applyStep(props.steps[i])
    }
    
    playerState.currentIndex = targetIndex
    player.value?.seek(targetIndex)
    render()
  }
}

async function handleNext(): Promise<void> {
  if (playerState.currentIndex < props.steps.length - 1) {
    const step = props.steps[playerState.currentIndex]
    applyStep(step)
    playerState.currentIndex++
    player.value?.seek(playerState.currentIndex)
    render()
  }
}

function handleReset(): void {
  resetState()
  playerState.currentIndex = 0
  playerState.isPlaying = false
  player.value?.reset()
  render()
}

function handleSpeedChange(speed: number): void {
  playerState.speed = speed
  player.value?.setSpeed(speed)
}

// Reset state to initial
function resetState(): void {
  currentData.value = [...props.data]
  elementStates.value.clear()
  animatingElements.value.clear()
  currentDescription.value = ''
}

// Apply a single step to current data
function applyStep(step: AnimationStep): void {
  const targets = Array.isArray(step.target) ? step.target : [step.target]

  // Update description
  if (step.description) {
    currentDescription.value = step.description
  }

  switch (step.action) {
    case 'highlight':
      targets.forEach((i) => elementStates.value.set(i as number, 'highlighted'))
      break
    
    case 'unhighlight':
      targets.forEach((i) => elementStates.value.delete(i as number))
      break
    
    case 'push':
      // Add element to stack
      if (step.value !== undefined) {
        currentData.value.push(step.value as number | string)
        elementStates.value.set(currentData.value.length - 1, 'pushing')
        // Clear animation state after a delay
        setTimeout(() => {
          elementStates.value.delete(currentData.value.length - 1)
        }, 300)
      }
      break
    
    case 'pop':
      // Remove element from stack
      if (currentData.value.length > 0) {
        elementStates.value.set(currentData.value.length - 1, 'popping')
        currentData.value.pop()
      }
      break
    
    case 'peek':
      // Highlight top element
      if (currentData.value.length > 0) {
        elementStates.value.set(currentData.value.length - 1, 'peeking')
      }
      break
    
    case 'activate':
      targets.forEach((i) => elementStates.value.set(i as number, 'active'))
      break
    
    case 'deactivate':
      targets.forEach((i) => elementStates.value.delete(i as number))
      break
  }
}

// Calculate stack element positions
interface StackElement {
  index: number
  value: number | string
  x: number
  y: number
  width: number
  height: number
  isTop: boolean
}

function calculateStackLayout(
  data: (number | string)[],
  options: {
    width: number
    height: number
    itemWidth: number
    itemHeight: number
    padding: number
    maxVisibleItems: number
  }
): StackElement[] {
  const { width, height, itemWidth, itemHeight, padding, maxVisibleItems } = options
  
  const elements: StackElement[] = []
  const centerX = width / 2
  const bottomY = height - padding
  
  // Determine visible range
  const totalItems = data.length
  const visibleStart = Math.max(0, totalItems - maxVisibleItems)
  
  data.forEach((value, i) => {
    if (i < visibleStart) return // Skip items not visible
    
    const visibleIndex = i - visibleStart
    const stackIndex = totalItems - 1 - i // Top-to-bottom index
    
    const elementWidth = Math.min(itemWidth, width - padding * 2)
    const elementHeight = itemHeight
    
    elements.push({
      index: i,
      value,
      x: centerX - elementWidth / 2,
      y: bottomY - (visibleIndex + 1) * (elementHeight + 4),
      width: elementWidth,
      height: elementHeight,
      isTop: i === totalItems - 1,
    })
  })
  
  return elements
}

// Render the visualization
function render(): void {
  if (!renderer || !canvasContainerRef.value) return

  const { width, height } = canvasContainerRef.value.getBoundingClientRect()

  const elements = calculateStackLayout(currentData.value, {
    width,
    height,
    itemWidth: props.itemWidth,
    itemHeight: props.itemHeight,
    padding: props.config?.padding ?? 20,
    maxVisibleItems: props.maxVisibleItems,
  })

  renderer.clearShapes()

  // Draw stack container outline (optional visual guide)
  if (elements.length > 0) {
    const leftX = elements[0].x - 8
    const rightX = elements[0].x + elements[0].width + 8
    const bottomY = height - (props.config?.padding ?? 20)
    const topY = Math.min(...elements.map(e => e.y)) - 8
    
    // Left wall
    renderer.setShape({
      id: 'stack-left-wall',
      type: 'line',
      x: leftX,
      y: bottomY,
      x2: leftX,
      y2: topY,
      style: {
        stroke: 'rgba(100, 116, 139, 0.3)',
        strokeWidth: 2,
      },
    })
    
    // Bottom wall
    renderer.setShape({
      id: 'stack-bottom-wall',
      type: 'line',
      x: leftX,
      y: bottomY,
      x2: rightX,
      y2: bottomY,
      style: {
        stroke: 'rgba(100, 116, 139, 0.3)',
        strokeWidth: 2,
      },
    })
    
    // Right wall
    renderer.setShape({
      id: 'stack-right-wall',
      type: 'line',
      x: rightX,
      y: bottomY,
      x2: rightX,
      y2: topY,
      style: {
        stroke: 'rgba(100, 116, 139, 0.3)',
        strokeWidth: 2,
      },
    })
  }

  // Draw stack elements
  elements.forEach((element) => {
    const color = getElementColor(element.index)
    const state = elementStates.value.get(element.index)

    // Draw element box
    renderer!.setShape({
      id: `element-${element.index}`,
      type: 'rect',
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      style: {
        fill: color,
        borderRadius: 6,
      },
    })

    // Draw value text
    if (props.showValues) {
      renderer!.setShape({
        id: `value-${element.index}`,
        type: 'text',
        x: element.x + element.width / 2,
        y: element.y + element.height / 2,
        text: String(element.value),
        fontSize: 14,
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        textBaseline: 'middle',
        style: {
          fill: colors.value.text,
        },
      })
    }

    // Draw "TOP" indicator for top element
    if (element.isTop && currentData.value.length > 0) {
      renderer!.setShape({
        id: 'top-indicator',
        type: 'text',
        x: element.x - 10,
        y: element.y + element.height / 2,
        text: '← TOP',
        fontSize: 11,
        fontFamily: 'monospace',
        textAlign: 'right',
        textBaseline: 'middle',
        style: {
          fill: colors.value.active,
        },
      })
    }
  })

  // Draw empty state
  if (elements.length === 0) {
    renderer!.setShape({
      id: 'empty-text',
      type: 'text',
      x: width / 2,
      y: height / 2,
      text: '(empty stack)',
      fontSize: 14,
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      textBaseline: 'middle',
      style: {
        fill: 'rgba(100, 116, 139, 0.5)',
      },
    })
  }

  renderer.render()
}

// Setup canvas
onMounted(() => {
  if (!canvasRef.value || !canvasContainerRef.value) return

  const { width, height } = canvasContainerRef.value.getBoundingClientRect()
  renderer = new CanvasRenderer(canvasRef.value, {
    width,
    height,
    backgroundColor: colors.value.background,
  })

  resizeObserver = new ResizeObserver((entries) => {
    const { width: w, height: h } = entries[0].contentRect
    renderer?.resize(w, h)
    render()
  })

  resizeObserver.observe(canvasContainerRef.value)

  initPlayer()
  render()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  player.value?.destroy()
  renderer = null
  player.value = null
})

// Watch for data changes
watch(() => props.data, (newData) => {
  resetState()
  render()
}, { deep: true })

watch(() => props.steps, () => {
  initPlayer()
}, { deep: true })

// Expose player methods
defineExpose({
  play: () => player.value?.play(),
  pause: () => player.value?.pause(),
  next: () => player.value?.next(),
  prev: () => player.value?.prev(),
  reset: () => {
    resetState()
    player.value?.reset()
    render()
  },
  seek: (index: number) => player.value?.seek(index),
  setData: (data: (number | string)[]) => {
    currentData.value = [...data]
    elementStates.value.clear()
    render()
  },
  push: (value: number | string) => {
    currentData.value.push(value)
    render()
  },
  pop: () => {
    const value = currentData.value.pop()
    render()
    return value
  },
})
</script>

<style scoped>
.stack-viz {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: system-ui, -apple-system, sans-serif;
}

.stack-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}

.stack-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.stack-size {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.canvas-container {
  flex: 1;
  min-height: 200px;
  position: relative;
}

.stack-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.step-description {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.controls {
  flex-shrink: 0;
  margin-top: 8px;
}
</style>
