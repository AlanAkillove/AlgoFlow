<template>
  <div ref="containerRef" class="queue-viz">
    <!-- Step description display -->
    <Transition name="fade">
      <div v-if="currentDescription" class="step-description">
        {{ currentDescription }}
      </div>
    </Transition>
    
    <!-- Queue info display -->
    <div class="queue-info">
      <span class="queue-label">Queue</span>
      <span class="queue-size">Size: {{ currentData.length }}{{ props.circular && props.capacity ? ` / ${props.capacity}` : '' }}</span>
    </div>
    
    <div ref="canvasContainerRef" class="canvas-container">
      <canvas ref="canvasRef" class="queue-canvas" />
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
  itemSize?: number
  showValues?: boolean
  circular?: boolean
  capacity?: number
  showPointers?: boolean
}>(), {
  steps: () => [],
  stepIndex: 0,
  itemSize: 50,
  showValues: true,
  circular: false,
  capacity: 10,
  showPointers: true,
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

// Front and rear pointers (indices)
const frontPointer = ref(0)
const rearPointer = ref(props.data.length - 1)

// Element states
type ElementState = 'default' | 'highlighted' | 'active' | 'enqueuing' | 'dequeuing'
const elementStates = ref<Map<number, ElementState>>(new Map())

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
    case 'enqueuing':
      return colors.value.active
    case 'dequeuing':
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
  frontPointer.value = 0
  rearPointer.value = props.data.length - 1
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
    
    case 'enqueue':
      // Add element to rear of queue
      if (step.value !== undefined) {
        currentData.value.push(step.value as number | string)
        rearPointer.value = currentData.value.length - 1
        elementStates.value.set(rearPointer.value, 'enqueuing')
        setTimeout(() => elementStates.value.delete(rearPointer.value), 300)
      }
      break
    
    case 'dequeue':
      // Remove element from front of queue
      if (currentData.value.length > 0) {
        elementStates.value.set(frontPointer.value, 'dequeuing')
        currentData.value.shift()
        // Adjust rear pointer if needed
        if (currentData.value.length > 0) {
          rearPointer.value = currentData.value.length - 1
        } else {
          rearPointer.value = -1
        }
      }
      break
    
    case 'peek':
      // Highlight front element
      if (currentData.value.length > 0) {
        elementStates.value.set(frontPointer.value, 'highlighted')
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

// Calculate queue element positions
interface QueueElement {
  index: number
  value: number | string
  x: number
  y: number
  size: number
  isFront: boolean
  isRear: boolean
}

function calculateQueueLayout(
  data: (number | string)[],
  options: {
    width: number
    height: number
    itemSize: number
    padding: number
  }
): QueueElement[] {
  const { width, height, itemSize, padding } = options
  
  const elements: QueueElement[] = []
  const centerY = height / 2
  const startX = padding + 30 // Extra space for front pointer
  
  data.forEach((value, i) => {
    const elementSize = Math.min(itemSize, height - padding * 2 - 30)
    const gap = 4
    
    elements.push({
      index: i,
      value,
      x: startX + i * (elementSize + gap),
      y: centerY - elementSize / 2,
      size: elementSize,
      isFront: i === 0,
      isRear: i === data.length - 1,
    })
  })
  
  return elements
}

// Render the visualization
function render(): void {
  if (!renderer || !canvasContainerRef.value) return

  const { width, height } = canvasContainerRef.value.getBoundingClientRect()

  const elements = calculateQueueLayout(currentData.value, {
    width,
    height,
    itemSize: props.itemSize,
    padding: props.config?.padding ?? 20,
  })

  renderer.clearShapes()

  // Draw flow direction arrow
  if (elements.length > 0) {
    const arrowY = height / 2
    const arrowStartX = 10
    const arrowEndX = 25
    
    renderer!.setShape({
      id: 'flow-arrow',
      type: 'line',
      x: arrowStartX,
      y: arrowY,
      x2: arrowEndX,
      y2: arrowY,
      style: {
        stroke: 'rgba(100, 116, 139, 0.4)',
        strokeWidth: 2,
      },
    })
    
    // Arrow head (simplified)
    renderer!.setShape({
      id: 'flow-arrow-head',
      type: 'line',
      x: arrowEndX - 5,
      y: arrowY - 5,
      x2: arrowEndX,
      y2: arrowY,
      style: {
        stroke: 'rgba(100, 116, 139, 0.4)',
        strokeWidth: 2,
      },
    })
    renderer!.setShape({
      id: 'flow-arrow-head2',
      type: 'line',
      x: arrowEndX - 5,
      y: arrowY + 5,
      x2: arrowEndX,
      y2: arrowY,
      style: {
        stroke: 'rgba(100, 116, 139, 0.4)',
        strokeWidth: 2,
      },
    })
  }

  // Draw queue elements
  elements.forEach((element) => {
    const color = getElementColor(element.index)
    const state = elementStates.value.get(element.index)

    // Draw element box (square)
    renderer!.setShape({
      id: `element-${element.index}`,
      type: 'rect',
      x: element.x,
      y: element.y,
      width: element.size,
      height: element.size,
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
        x: element.x + element.size / 2,
        y: element.y + element.size / 2,
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

    // Draw front and rear pointers
    if (props.showPointers) {
      if (element.isFront && currentData.value.length > 0) {
        // Front pointer (above)
        renderer!.setShape({
          id: 'front-pointer-line',
          type: 'line',
          x: element.x + element.size / 2,
          y: element.y - 5,
          x2: element.x + element.size / 2,
          y2: element.y - 20,
          style: {
            stroke: colors.value.highlight,
            strokeWidth: 2,
          },
        })
        renderer!.setShape({
          id: 'front-pointer-text',
          type: 'text',
          x: element.x + element.size / 2,
          y: element.y - 25,
          text: 'FRONT',
          fontSize: 10,
          fontFamily: 'monospace',
          textAlign: 'center',
          textBaseline: 'bottom',
          style: {
            fill: colors.value.highlight,
          },
        })
      }
      
      if (element.isRear && currentData.value.length > 0) {
        // Rear pointer (below)
        renderer!.setShape({
          id: 'rear-pointer-line',
          type: 'line',
          x: element.x + element.size / 2,
          y: element.y + element.size + 5,
          x2: element.x + element.size / 2,
          y2: element.y + element.size + 20,
          style: {
            stroke: colors.value.active,
            strokeWidth: 2,
          },
        })
        renderer!.setShape({
          id: 'rear-pointer-text',
          type: 'text',
          x: element.x + element.size / 2,
          y: element.y + element.size + 25,
          text: 'REAR',
          fontSize: 10,
          fontFamily: 'monospace',
          textAlign: 'center',
          textBaseline: 'top',
          style: {
            fill: colors.value.active,
          },
        })
      }
    }
  })

  // Draw empty state
  if (elements.length === 0) {
    renderer!.setShape({
      id: 'empty-text',
      type: 'text',
      x: width / 2,
      y: height / 2,
      text: '(empty queue)',
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
  enqueue: (value: number | string) => {
    currentData.value.push(value)
    rearPointer.value = currentData.value.length - 1
    render()
  },
  dequeue: () => {
    const value = currentData.value.shift()
    if (currentData.value.length > 0) {
      rearPointer.value = currentData.value.length - 1
    } else {
      rearPointer.value = -1
    }
    render()
    return value
  },
})
</script>

<style scoped>
.queue-viz {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: system-ui, -apple-system, sans-serif;
}

.queue-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}

.queue-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.queue-size {
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

.queue-canvas {
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
