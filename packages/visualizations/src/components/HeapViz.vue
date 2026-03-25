<template>
  <div ref="containerRef" class="heap-viz">
    <!-- Step description display -->
    <Transition name="fade">
      <div v-if="currentDescription" class="step-description">
        {{ currentDescription }}
      </div>
    </Transition>
    
    <!-- Heap info display -->
    <div class="heap-info">
      <span class="heap-label">{{ heapTypeLabel }} Heap</span>
      <span class="heap-size">Size: {{ currentData.length }}</span>
    </div>
    
    <div ref="canvasContainerRef" class="canvas-container">
      <canvas ref="canvasRef" class="heap-canvas" />
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
  type HeapType,
  COLOR_THEMES 
} from '../types'
import PlayerControls from './PlayerControls.vue'

// Props
const props = withDefaults(defineProps<{
  data: number[]
  steps?: AnimationStep[]
  stepIndex?: number
  config?: VisualizationConfig
  heapType?: HeapType
  nodeRadius?: number
  showValues?: boolean
  showIndices?: boolean
}>(), {
  steps: () => [],
  stepIndex: 0,
  heapType: 'max',
  nodeRadius: 24,
  showValues: true,
  showIndices: false,
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
const currentData = ref<number[]>([...props.data])

// Element states
type ElementState = 'default' | 'highlighted' | 'comparing' | 'swapping' | 'inserted' | 'extracted'
const elementStates = ref<Map<number, ElementState>>(new Map())

// Current step description
const currentDescription = ref<string>('')

// Heap type label
const heapTypeLabel = computed(() => props.heapType === 'min' ? 'Min' : 'Max')

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

// Get color for node based on state
function getNodeColor(index: number): string {
  const state = elementStates.value.get(index)
  switch (state) {
    case 'highlighted':
      return colors.value.highlight
    case 'comparing':
      return colors.value.comparing
    case 'swapping':
      return colors.value.active
    case 'inserted':
      return colors.value.complete
    case 'extracted':
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
    
    case 'compare':
      targets.forEach((i) => elementStates.value.set(i as number, 'comparing'))
      break
    
    case 'swap':
      if (targets.length === 2) {
        const [i, j] = targets as [number, number]
        const temp = currentData.value[i]
        currentData.value[i] = currentData.value[j]
        currentData.value[j] = temp
        
        elementStates.value.set(i, 'swapping')
        elementStates.value.set(j, 'swapping')
        setTimeout(() => {
          elementStates.value.delete(i)
          elementStates.value.delete(j)
        }, 300)
      }
      break
    
    case 'push':
      // Insert element into heap
      if (step.value !== undefined) {
        currentData.value.push(step.value as number)
        elementStates.value.set(currentData.value.length - 1, 'inserted')
        setTimeout(() => elementStates.value.delete(currentData.value.length - 1), 300)
      }
      break
    
    case 'pop':
      // Extract root element from heap
      if (currentData.value.length > 0) {
        elementStates.value.set(0, 'extracted')
        currentData.value.shift()
      }
      break
    
    case 'activate':
      targets.forEach((i) => elementStates.value.set(i as number, 'highlighted'))
      break
    
    case 'deactivate':
      targets.forEach((i) => elementStates.value.delete(i as number))
      break
  }
}

// Heap node position interface
interface HeapNode {
  index: number
  value: number
  x: number
  y: number
  depth: number
}

// Calculate heap tree layout
function calculateHeapLayout(
  data: number[],
  options: {
    width: number
    height: number
    nodeRadius: number
    padding: number
  }
): HeapNode[] {
  const { width, height, nodeRadius, padding } = options
  
  if (data.length === 0) return []
  
  const nodes: HeapNode[] = []
  const depth = Math.floor(Math.log2(data.length)) + 1
  
  // Calculate vertical spacing
  const verticalGap = Math.max(40, (height - padding * 2 - nodeRadius * 2) / Math.max(1, depth - 1))
  
  data.forEach((value, index) => {
    const nodeDepth = Math.floor(Math.log2(index + 1))
    const positionInLevel = index - (Math.pow(2, nodeDepth) - 1)
    const nodesInLevel = Math.pow(2, nodeDepth)
    
    // Horizontal position
    const levelWidth = width - padding * 2
    const xSpacing = levelWidth / (nodesInLevel + 1)
    const x = padding + xSpacing * (positionInLevel + 1)
    
    // Vertical position
    const y = padding + nodeRadius + nodeDepth * verticalGap
    
    nodes.push({
      index,
      value,
      x,
      y,
      depth: nodeDepth,
    })
  })
  
  return nodes
}

// Get parent index
function getParentIndex(index: number): number {
  return Math.floor((index - 1) / 2)
}

// Get children indices
function getChildrenIndices(index: number, length: number): [number | null, number | null] {
  const left = 2 * index + 1
  const right = 2 * index + 2
  return [
    left < length ? left : null,
    right < length ? right : null,
  ]
}

// Render the visualization
function render(): void {
  if (!renderer || !canvasContainerRef.value) return

  const { width, height } = canvasContainerRef.value.getBoundingClientRect()

  const nodes = calculateHeapLayout(currentData.value, {
    width,
    height,
    nodeRadius: props.nodeRadius,
    padding: props.config?.padding ?? 40,
  })

  renderer.clearShapes()

  // Draw edges first
  nodes.forEach((node) => {
    const [leftIndex, rightIndex] = getChildrenIndices(node.index, currentData.value.length)
    
    // Draw edge to left child
    if (leftIndex !== null && nodes[leftIndex]) {
      const child = nodes[leftIndex]
      renderer!.setShape({
        id: `edge-${node.index}-${leftIndex}`,
        type: 'line',
        x: node.x,
        y: node.y + props.nodeRadius,
        x2: child.x,
        y2: child.y - props.nodeRadius,
        style: {
          stroke: 'rgba(100, 116, 139, 0.4)',
          strokeWidth: 2,
        },
      })
    }
    
    // Draw edge to right child
    if (rightIndex !== null && nodes[rightIndex]) {
      const child = nodes[rightIndex]
      renderer!.setShape({
        id: `edge-${node.index}-${rightIndex}`,
        type: 'line',
        x: node.x,
        y: node.y + props.nodeRadius,
        x2: child.x,
        y2: child.y - props.nodeRadius,
        style: {
          stroke: 'rgba(100, 116, 139, 0.4)',
          strokeWidth: 2,
        },
      })
    }
  })

  // Draw nodes
  nodes.forEach((node) => {
    const color = getNodeColor(node.index)
    const state = elementStates.value.get(node.index)

    // Draw node circle
    renderer!.setShape({
      id: `node-${node.index}`,
      type: 'circle',
      x: node.x,
      y: node.y,
      radius: props.nodeRadius,
      style: {
        fill: color,
        stroke: state ? color : 'rgba(255, 255, 255, 0.1)',
        strokeWidth: state ? 3 : 1,
      },
    })

    // Draw value text
    if (props.showValues) {
      renderer!.setShape({
        id: `value-${node.index}`,
        type: 'text',
        x: node.x,
        y: node.y,
        text: String(node.value),
        fontSize: 14,
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        textBaseline: 'middle',
        style: {
          fill: colors.value.text,
        },
      })
    }

    // Draw index
    if (props.showIndices) {
      renderer!.setShape({
        id: `index-${node.index}`,
        type: 'text',
        x: node.x,
        y: node.y + props.nodeRadius + 12,
        text: `[${node.index}]`,
        fontSize: 10,
        fontFamily: 'monospace',
        textAlign: 'center',
        textBaseline: 'top',
        style: {
          fill: 'rgba(100, 116, 139, 0.6)',
        },
      })
    }
  })

  // Draw empty state
  if (nodes.length === 0) {
    renderer!.setShape({
      id: 'empty-text',
      type: 'text',
      x: width / 2,
      y: height / 2,
      text: '(empty heap)',
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
  setData: (data: number[]) => {
    currentData.value = [...data]
    elementStates.value.clear()
    render()
  },
})
</script>

<style scoped>
.heap-viz {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: system-ui, -apple-system, sans-serif;
}

.heap-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}

.heap-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.heap-size {
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

.heap-canvas {
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
