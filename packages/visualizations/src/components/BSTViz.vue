<template>
  <div ref="containerRef" class="bst-viz">
    <!-- Step description display -->
    <Transition name="fade">
      <div v-if="currentDescription" class="step-description">
        {{ currentDescription }}
      </div>
    </Transition>
    
    <!-- BST info display -->
    <div class="bst-info">
      <span class="bst-label">Binary Search Tree</span>
      <span class="bst-size">Nodes: {{ nodeCount }}</span>
    </div>
    
    <div ref="canvasContainerRef" class="canvas-container">
      <canvas
        ref="canvasRef"
        class="bst-canvas"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @wheel.prevent="onWheel"
        @dblclick="resetView"
      />
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
  type TreeNode,
  COLOR_THEMES 
} from '../types'
import { calculateTreeLayout, getTreeEdges, type TreeNodeLayout } from '../layouts/tree'
import PlayerControls from './PlayerControls.vue'

// Props
const props = withDefaults(defineProps<{
  data: TreeNode[]
  steps?: AnimationStep[]
  stepIndex?: number
  config?: VisualizationConfig
  nodeRadius?: number
  showValues?: boolean
  highlightPath?: boolean
}>(), {
  steps: () => [],
  stepIndex: 0,
  nodeRadius: 24,
  showValues: true,
  highlightPath: true,
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
const currentData = ref<TreeNode[]>([...props.data])

// Element states
type ElementState = 'default' | 'highlighted' | 'comparing' | 'inserting' | 'deleting' | 'found' | 'path'
const elementStates = ref<Map<string, ElementState>>(new Map())

// Current step description
const currentDescription = ref<string>('')

// Pan and zoom state
const transform = ref({ x: 0, y: 0, scale: 1 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// Node count
const nodeCount = computed(() => countNodes(currentData.value[0]))

function countNodes(node: TreeNode | undefined): number {
  if (!node) return 0
  return 1 + (node.children?.reduce((sum, child) => sum + countNodes(child), 0) ?? 0)
}

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
function getNodeColor(nodeId: string): string {
  const state = elementStates.value.get(nodeId)
  switch (state) {
    case 'highlighted':
    case 'found':
      return colors.value.highlight
    case 'comparing':
      return colors.value.comparing
    case 'inserting':
      return colors.value.complete
    case 'deleting':
      return colors.value.error
    case 'path':
      return colors.value.active
    default:
      return colors.value.primary
  }
}

// Pan handlers
function onMouseDown(e: MouseEvent): void {
  isDragging.value = true
  dragStart.value = { x: e.clientX - transform.value.x, y: e.clientY - transform.value.y }
  if (canvasRef.value) {
    canvasRef.value.style.cursor = 'grabbing'
  }
}

function onMouseMove(e: MouseEvent): void {
  if (!isDragging.value) return
  transform.value.x = e.clientX - dragStart.value.x
  transform.value.y = e.clientY - dragStart.value.y
  render()
}

function onMouseUp(): void {
  isDragging.value = false
  if (canvasRef.value) {
    canvasRef.value.style.cursor = 'grab'
  }
}

// Zoom handler
function onWheel(e: WheelEvent): void {
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(5, transform.value.scale * delta))
  
  const rect = canvasRef.value?.getBoundingClientRect()
  if (rect) {
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const scaleChange = newScale / transform.value.scale
    transform.value.x = mouseX - (mouseX - transform.value.x) * scaleChange
    transform.value.y = mouseY - (mouseY - transform.value.y) * scaleChange
  }
  
  transform.value.scale = newScale
  render()
}

function resetView(): void {
  transform.value = { x: 0, y: 0, scale: 1 }
  render()
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
      targets.forEach((id) => elementStates.value.set(String(id), 'highlighted'))
      break
    
    case 'unhighlight':
      targets.forEach((id) => elementStates.value.delete(String(id)))
      break
    
    case 'compare':
      targets.forEach((id) => elementStates.value.set(String(id), 'comparing'))
      break
    
    case 'traverse':
      if (props.highlightPath) {
        targets.forEach((id) => elementStates.value.set(String(id), 'path'))
      }
      break
    
    case 'focus':
      targets.forEach((id) => elementStates.value.set(String(id), 'found'))
      break
    
    case 'activate':
      targets.forEach((id) => elementStates.value.set(String(id), 'inserting'))
      break
    
    case 'deactivate':
      targets.forEach((id) => elementStates.value.delete(String(id)))
      break
  }
}

// Render the visualization
function render(): void {
  if (!renderer || !containerRef.value || currentData.value.length === 0) return

  const { width, height } = containerRef.value.getBoundingClientRect()
  const root = currentData.value[0]

  const layoutRoot = calculateTreeLayout(root, {
    width,
    height,
    padding: props.config?.padding ?? 50,
    nodeRadius: props.nodeRadius,
  })

  const edges = getTreeEdges(layoutRoot)

  renderer.clearShapes()
  
  // Helper to apply transform
  const tx = (x: number) => x * transform.value.scale + transform.value.x
  const ty = (y: number) => y * transform.value.scale + transform.value.y
  const ts = (s: number) => s * transform.value.scale

  // Draw edges first
  edges.forEach((edge) => {
    const sourceState = elementStates.value.get(edge.source.id)
    const isPath = sourceState === 'path'
    
    renderer!.setShape({
      id: `edge-${edge.source.id}-${edge.target.id}`,
      type: 'line',
      x: tx(edge.source.x),
      y: ty(edge.source.y + props.nodeRadius),
      x2: tx(edge.target.x),
      y2: ty(edge.target.y - props.nodeRadius),
      style: {
        stroke: isPath ? colors.value.active : 'rgba(100, 116, 139, 0.4)',
        strokeWidth: isPath ? 3 : 2,
      },
    })
  })

  // Collect all nodes via traversal
  const allNodes: TreeNodeLayout[] = []
  function collectNodes(node: TreeNodeLayout): void {
    allNodes.push(node)
    node.children.forEach(collectNodes)
  }
  collectNodes(layoutRoot)

  // Draw nodes
  allNodes.forEach((node) => {
    const color = getNodeColor(node.id)
    const state = elementStates.value.get(node.id)

    // Draw node circle
    renderer!.setShape({
      id: `node-${node.id}`,
      type: 'circle',
      x: tx(node.x),
      y: ty(node.y),
      radius: ts(props.nodeRadius),
      style: {
        fill: color,
        stroke: state ? color : 'rgba(255, 255, 255, 0.1)',
        strokeWidth: state ? 3 : 1,
      },
    })

    // Draw value text
    if (props.showValues) {
      renderer!.setShape({
        id: `value-${node.id}`,
        type: 'text',
        x: tx(node.x),
        y: ty(node.y),
        text: String(node.value),
        fontSize: ts(14),
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        textBaseline: 'middle',
        style: {
          fill: colors.value.text,
        },
      })
    }
  })

  // Draw empty state
  if (allNodes.length === 0) {
    renderer!.setShape({
      id: 'empty-text',
      type: 'text',
      x: width / 2,
      y: height / 2,
      text: '(empty BST)',
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
  setData: (data: TreeNode[]) => {
    currentData.value = [...data]
    elementStates.value.clear()
    render()
  },
  resetView,
})
</script>

<style scoped>
.bst-viz {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: system-ui, -apple-system, sans-serif;
}

.bst-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}

.bst-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.bst-size {
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

.bst-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

.bst-canvas:active {
  cursor: grabbing;
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
