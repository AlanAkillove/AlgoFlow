<template>
  <div ref="containerRef" class="array-viz">
    <div ref="canvasContainerRef" class="canvas-container">
      <canvas ref="canvasRef" class="array-canvas" />
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
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { AnimationPlayer, CanvasRenderer } from '@algoflow/animation'
import type { AnimationStep } from '@algoflow/animation'
import { calculateArrayLayout } from '../layouts/array'
import type { VisualizationConfig } from '../types'
import PlayerControls from './PlayerControls.vue'

const props = withDefaults(defineProps<{
  data: number[]
  steps?: AnimationStep[]
  stepIndex?: number
  config?: VisualizationConfig
  barWidth?: number
  gap?: number
  showValues?: boolean
  orientation?: 'horizontal' | 'vertical'
}>(), {
  steps: () => [],
  stepIndex: 0,
  barWidth: undefined,
  gap: 2,
  showValues: true,
  orientation: 'vertical',
})

const emit = defineEmits<{
  step: [index: number]
  complete: []
}>()

const containerRef = ref<HTMLDivElement>()
const canvasContainerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()

let renderer: CanvasRenderer | null = null
let resizeObserver: ResizeObserver | null = null

const player = ref<AnimationPlayer | null>(null)
const playerState = reactive({
  isPlaying: false,
  currentIndex: 0,
  totalSteps: 0,
  speed: 1,
})

// Current data state (for animation)
const currentData = ref<number[]>([...props.data])

// Highlighted indices
const highlightedIndices = ref<Set<number>>(new Set())

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

  player.value.on('step', ({ index, step }) => {
    playerState.currentIndex = index
    applyStep(step)
    emit('step', index)
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
    emit('complete')
  })

  player.value.on('reset', () => {
    playerState.currentIndex = 0
    playerState.isPlaying = false
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
    // Reset and replay to previous step
    currentData.value = [...props.data]
    highlightedIndices.value.clear()
    
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
  currentData.value = [...props.data]
  highlightedIndices.value.clear()
  playerState.currentIndex = 0
  playerState.isPlaying = false
  player.value?.reset()
  render()
}

function handleSpeedChange(speed: number): void {
  playerState.speed = speed
  player.value?.setSpeed(speed)
}

// Apply a single step to current data
function applyStep(step: AnimationStep): void {
  const targets = Array.isArray(step.target) ? step.target : [step.target]

  switch (step.action) {
    case 'highlight':
      targets.forEach((i) => highlightedIndices.value.add(i))
      break
    case 'unhighlight':
      targets.forEach((i) => highlightedIndices.value.delete(i))
      break
    case 'swap':
      if (targets.length === 2) {
        const [i, j] = targets
        const temp = currentData.value[i]
        currentData.value[i] = currentData.value[j]
        currentData.value[j] = temp
      }
      break
    case 'setValue':
      if (targets.length === 1 && step.value !== undefined) {
        currentData.value[targets[0]] = step.value as number
      }
      break
    case 'complete':
      targets.forEach((i) => highlightedIndices.value.add(i))
      break
  }
}

// Render the visualization
function render(): void {
  if (!renderer || !canvasContainerRef.value) return

  const { width, height } = canvasContainerRef.value.getBoundingClientRect()

  const bars = calculateArrayLayout(currentData.value, {
    width,
    height,
    barWidth: props.barWidth,
    gap: props.gap,
    padding: props.config?.padding ?? 20,
  })

  renderer.clearShapes()

  bars.forEach((bar) => {
    const isHighlighted = highlightedIndices.value.has(bar.index)

    renderer!.setShape({
      id: `bar-${bar.index}`,
      type: 'rect',
      x: bar.x,
      y: bar.y,
      width: bar.width,
      height: bar.height,
      style: {
        fill: isHighlighted ? (props.config?.highlightColor ?? '#3b82f6') : (props.config?.primaryColor ?? '#64748b'),
        borderRadius: 2,
      },
    })

    if (props.showValues && bar.height > 20) {
      renderer!.setShape({
        id: `value-${bar.index}`,
        type: 'text',
        x: bar.x + bar.width / 2,
        y: bar.y + 15,
        text: String(bar.value),
        style: {
          fill: '#ffffff',
          fontSize: 12,
          fontFamily: 'sans-serif',
        },
      })
    }
  })

  renderer.render()
}

// Setup canvas
onMounted(() => {
  if (!canvasRef.value || !canvasContainerRef.value) return

  const { width, height } = canvasContainerRef.value.getBoundingClientRect()
  renderer = new CanvasRenderer(canvasRef.value, {
    width,
    height,
    backgroundColor: props.config?.backgroundColor ?? 'transparent',
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
  renderer = null
})

// Watch for data changes
watch(() => props.data, (newData) => {
  currentData.value = [...newData]
  highlightedIndices.value.clear()
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
    currentData.value = [...props.data]
    highlightedIndices.value.clear()
    player.value?.reset()
    render()
  },
  seek: (index: number) => player.value?.seek(index),
})
</script>

<style scoped>
.array-viz {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.canvas-container {
  flex: 1;
  min-height: 200px;
  position: relative;
}

.array-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.controls {
  flex-shrink: 0;
  margin-top: 8px;
}
</style>
