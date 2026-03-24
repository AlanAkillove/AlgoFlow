<template>
  <div ref="containerRef" class="tree-viz">
    <div ref="canvasContainerRef" class="canvas-container">
      <canvas
        ref="canvasRef"
        class="tree-canvas"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @wheel.prevent="onWheel"
        @dblclick="resetView"
      />
    </div>
    <div v-if="traversalSequence.length > 0" class="traversal-result">
      <span class="traversal-label">遍历序列：</span>
      <span class="traversal-values">{{ traversalSequence.join(' → ') }}</span>
    </div>
    <PlayerControls
      v-if="steps.length > 0"
      class="controls"
      :current-index="currentStep"
      :total-steps="steps.length"
      :is-playing="isPlaying"
      :speed="speed"
      @play="play"
      @pause="pause"
      @reset="reset"
      @prev="prev"
      @next="next"
      @speed-change="setSpeed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { CanvasRenderer } from '@algoflow/animation'
import type { AnimationStep } from '@algoflow/animation'
import { calculateTreeLayout, getTreeEdges } from '../layouts/tree'
import type { TreeNode, VisualizationConfig } from '../types'
import PlayerControls from './PlayerControls.vue'

const props = withDefaults(defineProps<{
  data: TreeNode[]
  steps?: AnimationStep[]
  stepIndex?: number
  config?: VisualizationConfig
  nodeRadius?: number
  horizontalSpacing?: number
  verticalSpacing?: number
  showValues?: boolean
}>(), {
  steps: () => [],
  stepIndex: 0,
  nodeRadius: 28,
  showValues: true,
})

const containerRef = ref<HTMLDivElement>()
const canvasContainerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()

let renderer: CanvasRenderer | null = null
let resizeObserver: ResizeObserver | null = null

const highlightedNodes = ref<Set<string>>(new Set())
const currentStep = ref(0)
const isPlaying = ref(false)
const currentDescription = ref('')
const speed = ref(1)
const traversalSequence = ref<(number | string)[]>([])

// Pan and zoom state
const transform = ref({ x: 0, y: 0, scale: 1 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

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

// Zoom handlers
function onWheel(e: WheelEvent): void {
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(5, transform.value.scale * delta))
  
  // Zoom towards mouse position
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

function render(): void {
  if (!renderer || !containerRef.value || props.data.length === 0) return

  const { width, height } = containerRef.value.getBoundingClientRect()
  const root = props.data[0]

  const layout = calculateTreeLayout(root, {
    width,
    height,
    padding: props.config?.padding ?? 50,
    nodeRadius: props.nodeRadius,
  })

  const edges = getTreeEdges(layout)

  renderer.clearShapes()
  
  // Helper to apply transform
  const tx = (x: number) => x * transform.value.scale + transform.value.x
  const ty = (y: number) => y * transform.value.scale + transform.value.y
  const ts = (s: number) => s * transform.value.scale

  // Draw edges first
  edges.forEach((edge, i) => {
    renderer!.setShape({
      id: `edge-${i}`,
      type: 'line',
      x: tx(edge.source.x),
      y: ty(edge.source.y),
      x2: tx(edge.target.x),
      y2: ty(edge.target.y),
      style: {
        stroke: '#475569',
        strokeWidth: ts(3),
      },
    })
  })

  // Draw nodes
  function drawNode(node: typeof layout): void {
    const isHighlighted = highlightedNodes.value.has(node.id)

    // Draw circle
    renderer!.setShape({
      id: `node-${node.id}`,
      type: 'circle',
      x: tx(node.x),
      y: ty(node.y),
      radius: ts(props.nodeRadius),
      style: {
        fill: isHighlighted ? (props.config?.highlightColor ?? '#3b82f6') : (props.config?.primaryColor ?? '#64748b'),
        stroke: '#ffffff',
        strokeWidth: 3,
      },
    })

    // Draw value
    if (props.showValues) {
      renderer!.setShape({
        id: `value-${node.id}`,
        type: 'text',
        x: tx(node.x),
        y: ty(node.y),
        text: String(node.value),
        fontSize: ts(16),
        fontFamily: 'sans-serif',
        style: {
          fill: '#ffffff',
        },
      })
    }

    node.children.forEach(drawNode)
  }

  drawNode(layout)
  renderer.render()
}

function play(): void {
  isPlaying.value = true
  runAnimation()
}

function pause(): void {
  isPlaying.value = false
}

function reset(): void {
  currentStep.value = 0
  isPlaying.value = false
  highlightedNodes.value.clear()
  currentDescription.value = ''
  traversalSequence.value = []
  render()
}

async function prev(): Promise<void> {
  if (currentStep.value > 0) {
    currentStep.value--
    await executeStep(currentStep.value)
  }
}

async function next(): Promise<void> {
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++
    await executeStep(currentStep.value)
  } else {
    isPlaying.value = false
  }
}

function setSpeed(s: number): void {
  speed.value = s
}

async function runAnimation(): Promise<void> {
  while (isPlaying.value && currentStep.value < props.steps.length) {
    await executeStep(currentStep.value)
    if (!isPlaying.value) break
    currentStep.value++
    await new Promise(r => setTimeout(r, 500 / speed.value))
  }
  if (currentStep.value >= props.steps.length) {
    isPlaying.value = false
  }
}

async function executeStep(index: number): Promise<void> {
  const step = props.steps[index]
  if (!step) return
  
  currentDescription.value = step.description || ''
  
  // Handle both single target and array of targets
  const targets = Array.isArray(step.target) ? step.target : [step.target]
  
  if (step.action === 'highlight') {
    targets.forEach(id => {
      highlightedNodes.value.add(String(id))
      // Add to traversal sequence on highlight
      const nodeValue = findNodeValue(String(id))
      if (nodeValue !== null && !traversalSequence.value.includes(nodeValue)) {
        traversalSequence.value.push(nodeValue)
      }
    })
  } else if (step.action === 'unhighlight') {
    targets.forEach(id => highlightedNodes.value.delete(String(id)))
  } else if (step.action === 'complete') {
    targets.forEach(id => {
      highlightedNodes.value.add(String(id))
      const nodeValue = findNodeValue(String(id))
      if (nodeValue !== null && !traversalSequence.value.includes(nodeValue)) {
        traversalSequence.value.push(nodeValue)
      }
    })
  }
  
  render()
}

// Helper to find node value by id
function findNodeValue(id: string): number | string | null {
  if (!props.data[0]) return null
  
  function search(node: typeof props.data[0]): number | string | null {
    if (node.id === id) return node.value
    for (const child of (node.children || [])) {
      const result = search(child)
      if (result !== null) return result
    }
    return null
  }
  
  return search(props.data[0])
}

onMounted(() => {
  if (!canvasRef.value || !containerRef.value) return

  const { width, height } = canvasContainerRef.value?.getBoundingClientRect() || containerRef.value.getBoundingClientRect()
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

  resizeObserver.observe(canvasContainerRef.value || containerRef.value)
  render()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  renderer = null
})

watch(() => props.data, render, { deep: true })

defineExpose({
  play,
  pause,
  reset,
})
</script>

<style scoped>
.tree-viz {
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

.tree-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

.tree-canvas:active {
  cursor: grabbing;
}

.traversal-result {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.traversal-label {
  color: #64748b;
  font-size: 13px;
}

.traversal-values {
  color: #3b82f6;
  font-size: 14px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.controls {
  flex-shrink: 0;
  margin-top: 8px;
}
</style>
