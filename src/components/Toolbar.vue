<script setup lang="ts">
/**
 * Toolbar Component
 * 
 * 底部工具栏，提供快捷功能入口：
 * - 画笔工具
 * - 激光笔
 * - 演讲者模式
 * - 帮助按钮
 * - 全屏切换
 */

interface Props {
  isDrawing: boolean
  isLaserPointer: boolean
  isPresenterMode: boolean
  isFullscreen: boolean
  theme: 'light' | 'dark'
}

defineProps<Props>()

const emit = defineEmits<{
  'toggle-drawing': []
  'toggle-laser': []
  'open-presenter': []
  'toggle-fullscreen': []
  'toggle-theme': []
  'show-help': []
}>()
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <!-- Drawing Tool -->
      <button 
        class="toolbar-btn"
        :class="{ active: isDrawing }"
        @click="emit('toggle-drawing')"
        title="画笔工具 (D)"
      >
        <span class="btn-icon">✏️</span>
        <span class="btn-label">画笔</span>
      </button>
      
      <!-- Laser Pointer -->
      <button 
        class="toolbar-btn"
        :class="{ active: isLaserPointer }"
        @click="emit('toggle-laser')"
        title="激光笔 (L)"
      >
        <span class="btn-icon">🔦</span>
        <span class="btn-label">激光笔</span>
      </button>
    </div>
    
    <div class="toolbar-divider" />
    
    <div class="toolbar-group">
      <!-- Presenter Mode -->
      <button 
        class="toolbar-btn"
        :class="{ active: isPresenterMode }"
        @click="emit('open-presenter')"
        title="演讲者模式 (P)"
      >
        <span class="btn-icon">🎤</span>
        <span class="btn-label">演讲者</span>
      </button>
      
      <!-- Fullscreen -->
      <button 
        class="toolbar-btn"
        :class="{ active: isFullscreen }"
        @click="emit('toggle-fullscreen')"
        title="全屏 (F)"
      >
        <span class="btn-icon">{{ isFullscreen ? '⛶' : '⛶' }}</span>
        <span class="btn-label">{{ isFullscreen ? '退出' : '全屏' }}</span>
      </button>
    </div>
    
    <div class="toolbar-divider" />
    
    <div class="toolbar-group">
      <!-- Theme Toggle -->
      <button 
        class="toolbar-btn"
        @click="emit('toggle-theme')"
        title="切换主题"
      >
        <span class="btn-icon">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
        <span class="btn-label">{{ theme === 'dark' ? '亮色' : '暗色' }}</span>
      </button>
      
      <!-- Help -->
      <button 
        class="toolbar-btn"
        @click="emit('show-help')"
        title="键盘快捷键 (?)"
      >
        <span class="btn-icon">❓</span>
        <span class="btn-label">帮助</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  position: fixed;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(12px);
  z-index: 90;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 28px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 8px;
}

.toolbar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 56px;
}

.toolbar-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.toolbar-btn:active {
  transform: translateY(0);
}

.toolbar-btn.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

.btn-label {
  font-size: 10px;
  font-weight: 500;
  color: #64748b;
  line-height: 1;
}

.toolbar-btn.active .btn-label {
  color: #3b82f6;
}

/* Dark theme support */
:global(.theme-dark) .toolbar {
  background: rgba(30, 30, 40, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
}

:global(.theme-dark) .toolbar-divider {
  background: rgba(255, 255, 255, 0.15);
}

:global(.theme-dark) .toolbar-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

:global(.theme-dark) .btn-label {
  color: #94a3b8;
}

:global(.theme-dark) .toolbar-btn.active .btn-label {
  color: #60a5fa;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .toolbar {
    bottom: 60px;
    padding: 6px 8px;
    gap: 2px;
  }
  
  .toolbar-btn {
    padding: 6px 8px;
    min-width: 48px;
  }
  
  .btn-label {
    display: none;
  }
  
  .btn-icon {
    font-size: 20px;
  }
}
</style>
