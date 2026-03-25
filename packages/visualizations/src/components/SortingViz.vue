<template>
  <div class="sorting-viz">
    <!-- Algorithm selector -->
    <div class="algorithm-selector">
      <label>Algorithm: </label>
      <select v-model="selectedAlgorithm" @change="onAlgorithmChange">
        <option value="bubble">Bubble Sort</option>
        <option value="selection">Selection Sort</option>
        <option value="insertion">Insertion Sort</option>
        <option value="quick">Quick Sort</option>
        <option value="merge">Merge Sort</option>
        <option value="heap">Heap Sort</option>
      </select>
      <span class="complexity">{{ complexity }}</span>
    </div>
    
    <ArrayViz
      ref="arrayVizRef"
      :data="data"
      :steps="generatedSteps"
      :config="config"
      :bar-width="barWidth"
      :gap="gap"
      :show-values="showValues"
      :show-indices="showIndices"
      :orientation="orientation"
      @step="onStep"
      @complete="onComplete"
      @reset="onReset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import ArrayViz from './ArrayViz.vue'
import type { AnimationStep } from '@algoflow/animation'
import { 
  type VisualizationConfig,
  type SortingAlgorithm,
} from '../types'

// Props
const props = withDefaults(defineProps<{
  data: number[]
  algorithm?: SortingAlgorithm
  config?: VisualizationConfig
  barWidth?: number
  gap?: number
  showValues?: boolean
  showIndices?: boolean
  orientation?: 'horizontal' | 'vertical'
  autoGenerateSteps?: boolean
}>(), {
  algorithm: 'bubble',
  showValues: true,
  showIndices: false,
  orientation: 'vertical',
  autoGenerateSteps: true,
})

// Events
const emit = defineEmits<{
  step: [index: number, step: AnimationStep]
  complete: []
  reset: []
}>()

// Refs
const arrayVizRef = ref<InstanceType<typeof ArrayViz>>()
const selectedAlgorithm = ref<SortingAlgorithm>(props.algorithm)
const generatedSteps = ref<AnimationStep[]>([])

// Algorithm complexity info
const complexity = computed(() => {
  const complexities: Record<SortingAlgorithm, string> = {
    bubble: 'O(n²)',
    selection: 'O(n²)',
    insertion: 'O(n²)',
    quick: 'O(n log n)',
    merge: 'O(n log n)',
    heap: 'O(n log n)',
    counting: 'O(n + k)',
    radix: 'O(nk)',
  }
  return complexities[selectedAlgorithm.value]
})

// Generate sorting steps based on algorithm
function generateSteps(algorithm: SortingAlgorithm, data: number[]): AnimationStep[] {
  const steps: AnimationStep[] = []
  const arr = [...data]
  
  switch (algorithm) {
    case 'bubble':
      generateBubbleSortSteps(arr, steps)
      break
    case 'selection':
      generateSelectionSortSteps(arr, steps)
      break
    case 'insertion':
      generateInsertionSortSteps(arr, steps)
      break
    case 'quick':
      generateQuickSortSteps(arr, 0, arr.length - 1, steps)
      break
    case 'merge':
      generateMergeSortSteps(arr, 0, arr.length - 1, steps)
      break
    case 'heap':
      generateHeapSortSteps(arr, steps)
      break
  }
  
  // Mark all as complete at the end
  steps.push({
    action: 'complete',
    target: arr.map((_, i) => i),
    duration: 300,
    description: 'Sorting complete!',
  })
  
  return steps
}

// Bubble Sort
function generateBubbleSortSteps(arr: number[], steps: AnimationStep[]): void {
  const n = arr.length
  
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Compare adjacent elements
      steps.push({
        action: 'compare',
        target: [j, j + 1],
        duration: 200,
        description: `Comparing ${arr[j]} and ${arr[j + 1]}`,
      })
      
      if (arr[j] > arr[j + 1]) {
        // Swap if needed
        steps.push({
          action: 'swap',
          target: [j, j + 1],
          duration: 300,
          description: `Swapping ${arr[j]} and ${arr[j + 1]}`,
        })
        ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
      }
    }
    // Mark the last element of this pass as complete
    steps.push({
      action: 'complete',
      target: n - i - 1,
      duration: 200,
      description: `Element at position ${n - i - 1} is in final position`,
    })
  }
  
  // First element is also complete
  steps.push({
    action: 'complete',
    target: 0,
    duration: 200,
    description: 'First element is in final position',
  })
}

// Selection Sort
function generateSelectionSortSteps(arr: number[], steps: AnimationStep[]): void {
  const n = arr.length
  
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    
    // Highlight the current minimum
    steps.push({
      action: 'highlight',
      target: i,
      duration: 200,
      description: `Starting from position ${i}, looking for minimum`,
    })
    
    for (let j = i + 1; j < n; j++) {
      // Compare with current minimum
      steps.push({
        action: 'compare',
        target: [minIdx, j],
        duration: 200,
        description: `Comparing ${arr[minIdx]} with ${arr[j]}`,
      })
      
      if (arr[j] < arr[minIdx]) {
        // Unhighlight old minimum
        steps.push({
          action: 'unhighlight',
          target: minIdx,
          duration: 100,
        })
        minIdx = j
        // Highlight new minimum
        steps.push({
          action: 'highlight',
          target: minIdx,
          duration: 100,
          description: `Found new minimum: ${arr[minIdx]}`,
        })
      }
    }
    
    if (minIdx !== i) {
      // Swap minimum to position i
      steps.push({
        action: 'swap',
        target: [i, minIdx],
        duration: 300,
        description: `Moving minimum ${arr[minIdx]} to position ${i}`,
      })
      ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
    }
    
    // Mark position i as complete
    steps.push({
      action: 'complete',
      target: i,
      duration: 200,
      description: `Position ${i} is sorted`,
    })
  }
  
  // Last element is also complete
  steps.push({
    action: 'complete',
    target: n - 1,
    duration: 200,
    description: 'All elements are sorted',
  })
}

// Insertion Sort
function generateInsertionSortSteps(arr: number[], steps: AnimationStep[]): void {
  const n = arr.length
  
  for (let i = 1; i < n; i++) {
    const key = arr[i]
    let j = i - 1
    
    // Highlight the element being inserted
    steps.push({
      action: 'highlight',
      target: i,
      duration: 200,
      description: `Inserting element ${key}`,
    })
    
    while (j >= 0 && arr[j] > key) {
      // Compare and shift
      steps.push({
        action: 'compare',
        target: [j, j + 1],
        duration: 200,
        description: `${arr[j]} > ${key}, shifting right`,
      })
      
      arr[j + 1] = arr[j]
      steps.push({
        action: 'setValue',
        target: j + 1,
        value: arr[j],
        duration: 200,
        description: `Shifting ${arr[j]} to position ${j + 1}`,
      })
      
      j--
    }
    
    // Insert the key
    arr[j + 1] = key
    steps.push({
      action: 'setValue',
      target: j + 1,
      value: key,
      duration: 200,
      description: `Inserted ${key} at position ${j + 1}`,
    })
  }
}

// Quick Sort
function generateQuickSortSteps(arr: number[], low: number, high: number, steps: AnimationStep[]): void {
  if (low < high) {
    const pivotIdx = partition(arr, low, high, steps)
    generateQuickSortSteps(arr, low, pivotIdx - 1, steps)
    generateQuickSortSteps(arr, pivotIdx + 1, high, steps)
  }
}

function partition(arr: number[], low: number, high: number, steps: AnimationStep[]): number {
  const pivot = arr[high]
  
  steps.push({
    action: 'highlight',
    target: high,
    duration: 200,
    description: `Pivot: ${pivot}`,
  })
  
  let i = low - 1
  
  for (let j = low; j < high; j++) {
    steps.push({
      action: 'compare',
      target: [j, high],
      duration: 200,
      description: `Comparing ${arr[j]} with pivot ${pivot}`,
    })
    
    if (arr[j] < pivot) {
      i++
      if (i !== j) {
        steps.push({
          action: 'swap',
          target: [i, j],
          duration: 300,
          description: `Swapping ${arr[i]} and ${arr[j]}`,
        })
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
    }
  }
  
  // Place pivot in correct position
  if (i + 1 !== high) {
    steps.push({
      action: 'swap',
      target: [i + 1, high],
      duration: 300,
      description: `Placing pivot ${pivot} in position ${i + 1}`,
    })
    ;[arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]
  }
  
  steps.push({
    action: 'complete',
    target: i + 1,
    duration: 200,
    description: `Pivot ${pivot} is in final position ${i + 1}`,
  })
  
  return i + 1
}

// Merge Sort
function generateMergeSortSteps(arr: number[], left: number, right: number, steps: AnimationStep[]): void {
  if (left < right) {
    const mid = Math.floor((left + right) / 2)
    generateMergeSortSteps(arr, left, mid, steps)
    generateMergeSortSteps(arr, mid + 1, right, steps)
    merge(arr, left, mid, right, steps)
  }
}

function merge(arr: number[], left: number, mid: number, right: number, steps: AnimationStep[]): void {
  const leftArr = arr.slice(left, mid + 1)
  const rightArr = arr.slice(mid + 1, right + 1)
  
  let i = 0, j = 0, k = left
  
  while (i < leftArr.length && j < rightArr.length) {
    steps.push({
      action: 'compare',
      target: [left + i, mid + 1 + j],
      duration: 200,
      description: `Comparing ${leftArr[i]} and ${rightArr[j]}`,
    })
    
    if (leftArr[i] <= rightArr[j]) {
      arr[k] = leftArr[i]
      steps.push({
        action: 'setValue',
        target: k,
        value: leftArr[i],
        duration: 200,
        description: `Placing ${leftArr[i]} at position ${k}`,
      })
      i++
    } else {
      arr[k] = rightArr[j]
      steps.push({
        action: 'setValue',
        target: k,
        value: rightArr[j],
        duration: 200,
        description: `Placing ${rightArr[j]} at position ${k}`,
      })
      j++
    }
    k++
  }
  
  while (i < leftArr.length) {
    arr[k] = leftArr[i]
    steps.push({
      action: 'setValue',
      target: k,
      value: leftArr[i],
      duration: 200,
    })
    i++
    k++
  }
  
  while (j < rightArr.length) {
    arr[k] = rightArr[j]
    steps.push({
      action: 'setValue',
      target: k,
      value: rightArr[j],
      duration: 200,
    })
    j++
    k++
  }
  
  // Mark merged section as complete
  for (let idx = left; idx <= right; idx++) {
    steps.push({
      action: 'complete',
      target: idx,
      duration: 100,
    })
  }
}

// Heap Sort
function generateHeapSortSteps(arr: number[], steps: AnimationStep[]): void {
  const n = arr.length
  
  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i, steps)
  }
  
  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    // Move current root to end
    steps.push({
      action: 'swap',
      target: [0, i],
      duration: 300,
      description: `Moving max element to position ${i}`,
    })
    ;[arr[0], arr[i]] = [arr[i], arr[0]]
    
    steps.push({
      action: 'complete',
      target: i,
      duration: 200,
      description: `Position ${i} is sorted`,
    })
    
    heapify(arr, i, 0, steps)
  }
  
  steps.push({
    action: 'complete',
    target: 0,
    duration: 200,
    description: 'Sorting complete',
  })
}

function heapify(arr: number[], n: number, i: number, steps: AnimationStep[]): void {
  let largest = i
  const left = 2 * i + 1
  const right = 2 * i + 2
  
  steps.push({
    action: 'highlight',
    target: i,
    duration: 200,
    description: `Heapifying at index ${i}`,
  })
  
  if (left < n) {
    steps.push({
      action: 'compare',
      target: [largest, left],
      duration: 200,
      description: `Comparing ${arr[largest]} with left child ${arr[left]}`,
    })
    if (arr[left] > arr[largest]) {
      largest = left
    }
  }
  
  if (right < n) {
    steps.push({
      action: 'compare',
      target: [largest, right],
      duration: 200,
      description: `Comparing ${arr[largest]} with right child ${arr[right]}`,
    })
    if (arr[right] > arr[largest]) {
      largest = right
    }
  }
  
  if (largest !== i) {
    steps.push({
      action: 'swap',
      target: [i, largest],
      duration: 300,
      description: `Swapping ${arr[i]} with ${arr[largest]}`,
    })
    ;[arr[i], arr[largest]] = [arr[largest], arr[i]]
    
    heapify(arr, n, largest, steps)
  }
}

// Event handlers
function onAlgorithmChange(): void {
  if (props.autoGenerateSteps) {
    generatedSteps.value = generateSteps(selectedAlgorithm.value, props.data)
  }
}

function onStep(index: number, step: AnimationStep): void {
  emit('step', index, step)
}

function onComplete(): void {
  emit('complete')
}

function onReset(): void {
  emit('reset')
}

// Watch for data changes
watch(() => props.data, () => {
  if (props.autoGenerateSteps) {
    generatedSteps.value = generateSteps(selectedAlgorithm.value, props.data)
  }
}, { immediate: true })

// Initialize
onMounted(() => {
  if (props.autoGenerateSteps) {
    generatedSteps.value = generateSteps(selectedAlgorithm.value, props.data)
  }
})

// Expose ArrayViz methods
defineExpose({
  play: () => arrayVizRef.value?.play(),
  pause: () => arrayVizRef.value?.pause(),
  next: () => arrayVizRef.value?.next(),
  prev: () => arrayVizRef.value?.prev(),
  reset: () => arrayVizRef.value?.reset(),
  seek: (index: number) => arrayVizRef.value?.seek(index),
})
</script>

<style scoped>
.sorting-viz {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.algorithm-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}

.algorithm-selector label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.algorithm-selector select {
  padding: 6px 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.algorithm-selector select:focus {
  outline: none;
  border-color: #3b82f6;
}

.complexity {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
  background: rgba(59, 130, 246, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
