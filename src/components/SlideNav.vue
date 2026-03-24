<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  total: number
  theme: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  prev: []
  next: []
  'go-to': [index: number]
  'toggle-theme': []
}>()

const progress = computed(() => {
  if (props.total === 0) return 0
  return (props.current / props.total) * 100
})
</script>

<template>
  <div class="slide-nav">
    <div class="nav-left">
      <button 
        class="nav-btn" 
        :disabled="current <= 1"
        @click="emit('prev')"
      >
        ←
      </button>
      <span class="page-indicator">{{ current }} / {{ total }}</span>
      <button 
        class="nav-btn" 
        :disabled="current >= total"
        @click="emit('next')"
      >
        →
      </button>
    </div>
    
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progress}%` }" />
    </div>
    
    <div class="nav-right">
      <button class="theme-btn" @click="emit('toggle-theme')">
        {{ theme === 'dark' ? '☀️' : '🌙' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.slide-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.03);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.nav-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}

.nav-btn:active:not(:disabled) {
  transform: translateY(0);
}

.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.page-indicator {
  font-family: var(--af-font-mono, 'JetBrains Mono', monospace);
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  min-width: 60px;
  text-align: center;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  margin: 0 24px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  transform: scale(1.05);
}
</style>
