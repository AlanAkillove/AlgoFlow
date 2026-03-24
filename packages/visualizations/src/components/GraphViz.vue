<template>
  <div ref="containerRef" class="graph-viz">
    <div ref="canvasContainerRef" class="canvas-container">
      <canvas ref="canvasRef" class="graph-canvas" />
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
import { calculateGraphLayout } from '../layouts/graph'
import type { GraphNode, GraphEdge, VisualizationConfig } from '../types'
import PlayerControls from './PlayerControls.vue'

const props = withDefaults(defineProps<{
  nodes: GraphNode[]
  edges: GraphEdge[]
  steps?: AnimationStep[]
  stepIndex?: number
  config?: VisualizationConfig
  nodeRadius?: number
  showLabels?: boolean
  useForceLayout?: boolean
}>(), {
  steps: () => [],
  stepIndex: 0,
  nodeRadius: 15,
  showLabels: true,
  useForceLayout: true,
})

const containerRef = ref<HTMLDivElement>()
const canvasContainerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()

let renderer: CanvasRenderer | null = null
let resizeObserver: ResizeObserver | null = null

const highlightedNodes = ref<Set<string>>(new Set())
const highlightedEdges = ref<Set<string>>(new Set())
const currentStep = ref(0)
const isPlaying = ref(false)
const speed = ref(1)

async function render(): Promise<void> {
  if (!renderer || !containerRef.value || props.nodes.length === 0) return

  const { width, height } = containerRef.value.getBoundingClientRect()

  const { nodes: layoutNodes, edges: layoutEdges } = await calculateGraphLayout(
    props.nodes,
    props.edges,
    {
      width,
      height,
      nodeRadius: props.nodeRadius,
    }
  )

  renderer.clearShapes()

  // Draw edges
  layoutEdges.forEach((edge, i) => {
    const isHighlighted = highlightedEdges.value.has(`edge-${i}`)
    
    renderer!.setShape({
      id: `edge-${i}`,
      type: 'line',
      x: edge.source.x,
      y: edge.source.y,
      x2: edge.target.x,
      y2: edge.target.y,
      style: {
        stroke: isHighlighted ? '#3b82f6' : '#e5e7eb',
        strokeWidth: isHighlighted ? 3 : 2,
      },
    })
  })

  // Draw nodes
  layoutNodes.forEach((node) => {
    const isHighlighted = highlightedNodes.value.has(node.id)

    // Draw circle
    renderer!.setShape({
      id: `node-${node.id}`,
      type: 'circle',
      x: node.x,
      y: node.y,
      radius: props.nodeRadius,
      style: {
        fill: isHighlighted ? (props.config?.highlightColor ?? '#3b82f6') : (props.config?.primaryColor ?? '#64748b'),
        stroke: '#ffffff',
        strokeWidth: 2,
      },
    })

    // Draw label
    if (props.showLabels && node.value !== undefined) {
      renderer!.setShape({
        id: `label-${node.id}`,
        type: 'text',
        x: node.x,
        y: node.y,
        text: String(node.value),
        fontSize: 12,
        fontFamily: 'sans-serif',
        style: {
          fill: '#ffffff',
        },
      })
    }
  })

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
  highlightedEdges.value.clear()
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
  
  if (step.action === 'highlight') {
    if (Array.isArray(step.target)) {
      step.target.forEach(id => {
        if (String(id).startsWith('edge-')) {
          highlightedEdges.value.add(String(id))
        } else {
          highlightedNodes.value.add(String(id))
        }
      })
    }
  } else if (step.action === 'unhighlight') {
    if (Array.isArray(step.target)) {
      step.target.forEach(id => {
        highlightedNodes.value.delete(String(id))
        highlightedEdges.value.delete(String(id))
      })
    }
  }
  
  render()
}

onMounted(async () => {
  if (!canvasRef.value || !containerRef.value) return

  const { width, height } = canvasContainerRef.value?.getBoundingClientRect() || containerRef.value.getBoundingClientRect()
  renderer = new CanvasRenderer(canvasRef.value, {
    width,
    height,
    backgroundColor: props.config?.backgroundColor ?? 'transparent',
  })

  resizeObserver = new ResizeObserver(async (entries) => {
    const { width: w, height: h } = entries[0].contentRect
    renderer?.resize(w, h)
    await render()
  })

  resizeObserver.observe(canvasContainerRef.value || containerRef.value)
  await render()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  renderer = null
})

watch(() => [props.nodes, props.edges], render, { deep: true })

defineExpose({
  play,
  pause,
  reset,
})
</script>

<style scoped>
.graph-viz {
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

.graph-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.controls {
  flex-shrink: 0;
  margin-top: 8px;
}
</style>
