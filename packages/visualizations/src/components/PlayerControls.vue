<template>
  <div class="player-controls">
    <button
      class="control-btn"
      :disabled="!canPlay"
      @click="handlePlayPause"
    >
      {{ isPlaying ? '⏸' : '▶' }}
    </button>
    
    <button
      class="control-btn"
      :disabled="!canPrev"
      @click="handlePrev"
    >
      ⏮
    </button>
    
    <button
      class="control-btn"
      :disabled="!canNext"
      @click="handleNext"
    >
      ⏭
    </button>
    
    <button 
      class="control-btn" 
      @click="handleReset"
    >
      ⏹
    </button>
    
    <div class="step-indicator">
      {{ currentIndex + 1 }} / {{ totalSteps }}
    </div>
    
    <div class="speed-control">
      <label>
        <input 
          type="range" 
          min="0.25" 
          max="4" 
          step="0.25" 
          :value="speed"
          @input="handleSpeedChange"
        />
        {{ speed }}x
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isPlaying: boolean
  currentIndex: number
  totalSteps: number
  speed: number
  canPlay?: boolean
  canPrev?: boolean
  canNext?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canPlay: true,
  canPrev: true,
  canNext: true,
})

const emit = defineEmits<{
  play: []
  pause: []
  prev: []
  next: []
  reset: []
  'speed-change': [speed: number]
}>()

function handlePlayPause(): void {
  if (props.isPlaying) {
    emit('pause')
  } else {
    emit('play')
  }
}

function handlePrev(): void {
  emit('prev')
}

function handleNext(): void {
  emit('next')
}

function handleReset(): void {
  emit('reset')
}

function handleSpeedChange(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('speed-change', parseFloat(target.value))
}
</script>

<style scoped>
.player-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.control-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.step-indicator {
  font-family: var(--af-font-mono, 'JetBrains Mono', monospace);
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  min-width: 70px;
  text-align: center;
  padding: 0 8px;
}

.speed-control {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
  padding-left: 8px;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
}

.speed-control label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.speed-control input[type="range"] {
  width: 80px;
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.speed-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  transition: transform 0.2s;
}

.speed-control input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}
</style>
