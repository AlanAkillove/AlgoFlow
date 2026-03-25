<script setup lang="ts">
/**
 * App.vue - 简化版主应用组件
 * 
 * 所有业务逻辑已迁移至 composables/useApp.ts
 */
import { useApp } from './composables'

// 导入组件
import SlideRenderer from './components/SlideRenderer.vue'
import SlideNav from './components/SlideNav.vue'
import Toolbar from './components/Toolbar.vue'

// 使用 useApp composable 获取所有状态和方法
const {
  // Slide state
  slides,
  currentIndex,
  totalSlides,
  currentSlide,
  nextSlide,
  globalTitle,

  // Theme
  currentTheme,
  toggleTheme,

  // UI state
  isFullscreen,
  showThumbnailNav,
  showKeyboardHints,
  showSpeakerNotes,
  showToolbar,

  // Drawing state
  isDrawing,
  drawingCanvas,
  drawingColor,
  drawingColors,
  isEraser,
  eraserSize,
  eraserSizes,
  brushSize,
  brushSizes,
  showEraserMenu,
  showBrushMenu,
  brushMenuColor,
  eraserCursorX,
  eraserCursorY,
  canUndo,
  canRedo,

  // Laser pointer
  isLaserPointer,
  laserX,
  laserY,

  // Presenter mode
  isPresenterMode,
  isPresenterWindow,
  elapsedTime,

  // Export mode
  isExportMode,

  // Methods
  goNext,
  goPrev,
  goTo,
  toggleFullscreen,
  startDrawing,
  draw,
  updateEraserCursor,
  stopDrawing,
  clearDrawing,
  undoDrawing,
  redoDrawing,
  updateLaserPosition,
  showToolbarOnMove,
  openPresenterWindow,
  formatTime,
  getSlideTitle,
} = useApp()

// Canvas mouse move handler (combines drawing and eraser cursor)
function handleCanvasMouseMove(e: MouseEvent) {
  draw(e)
  updateEraserCursor(e)
}
</script>

<template>
  <!-- Presenter View -->
  <div v-if="isPresenterWindow" class="presenter-view">
    <div class="presenter-header">
      <div class="presenter-title">🎤 演讲者视图</div>
      <div class="presenter-timer">⏱️ {{ formatTime(elapsedTime) }}</div>
    </div>
    
    <div class="presenter-content">
      <div class="presenter-current">
        <div class="presenter-label">当前幻灯片 ({{ currentIndex + 1 }}/{{ totalSlides }})</div>
        <div class="presenter-slide-preview">
          <SlideRenderer
            v-if="slides.length > 0"
            :content="slides[currentIndex].content"
            :frontmatter="slides[currentIndex].frontmatter"
            :export-mode="false"
            :layout="slides[currentIndex].layout"
            :animation="slides[currentIndex].animation"
            :transition="slides[currentIndex].transition"
          />
        </div>
      </div>
      
      <div class="presenter-sidebar">
        <div class="presenter-next">
          <div class="presenter-label">下一张</div>
          <div class="presenter-next-preview" v-if="nextSlide">
            <div class="next-title">{{ nextSlide.title }}</div>
          </div>
          <div class="presenter-next-preview" v-else>
            <div class="next-title">已是最后一张</div>
          </div>
        </div>
        
        <div class="presenter-notes" v-if="currentSlide?.notes">
          <div class="presenter-label">📝 备注</div>
          <div class="notes-text">{{ currentSlide.notes }}</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Main View -->
  <div 
    v-else
    class="algoflow-app" 
    :class="`theme-${currentTheme.name}`"
    @mousemove="(e: MouseEvent) => { updateLaserPosition(e); showToolbarOnMove(e) }"
  >
    <div class="slide-container">
      <Transition name="slide" mode="out-in">
        <SlideRenderer
          v-if="slides.length > 0"
          :key="currentIndex"
          :content="slides[currentIndex].content"
          :frontmatter="slides[currentIndex].frontmatter"
          :export-mode="isExportMode"
          :layout="slides[currentIndex].layout"
          :animation="slides[currentIndex].animation"
          :transition="slides[currentIndex].transition"
        />
      </Transition>
      
      <!-- Drawing Canvas -->
      <canvas
        v-if="isDrawing"
        ref="drawingCanvas"
        class="drawing-canvas"
        :class="{ 'eraser-cursor': isEraser }"
        @mousedown="startDrawing"
        @mousemove="handleCanvasMouseMove"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
      />
      
      <!-- Eraser Cursor Indicator -->
      <div 
        v-if="isEraser && isDrawing"
        class="eraser-indicator"
        :style="{
          left: `${eraserCursorX}px`,
          top: `${eraserCursorY}px`,
          width: `${eraserSize * 2}px`,
          height: `${eraserSize * 2}px`
        }"
      />
      
      <!-- Drawing Toolbar -->
      <Transition name="fade">
        <div v-if="isDrawing" class="drawing-toolbar">
          <!-- Color buttons with brush size menu -->
          <div 
            v-for="color in drawingColors" 
            :key="color"
            class="color-btn-wrapper"
          >
            <button
              class="color-btn"
              :class="{ active: drawingColor === color && !isEraser }"
              :style="{ background: color }"
              @click="isEraser = false; drawingColor = color; showBrushMenu = showBrushMenu === false || brushMenuColor !== color; brushMenuColor = color; showEraserMenu = false"
              @contextmenu.prevent="showBrushMenu = !showBrushMenu; brushMenuColor = color"
            />
            <!-- Brush size dropdown -->
            <div v-if="showBrushMenu && brushMenuColor === color" class="size-menu brush-menu">
              <div class="size-menu-title">粗细</div>
              <button
                v-for="size in brushSizes"
                :key="size"
                class="size-option"
                :class="{ active: brushSize === size }"
                @click="brushSize = size; showBrushMenu = false"
              >
                <span class="size-preview" :style="{ height: `${size}px`, background: color }"></span>
                <span>{{ size }}px</span>
              </button>
            </div>
          </div>
          
          <div class="toolbar-divider" />
          
          <!-- Eraser button with size menu -->
          <div class="eraser-btn-wrapper">
            <button 
              class="tool-btn" 
              :class="{ active: isEraser }" 
              @click="isEraser = !isEraser; showEraserMenu = !showEraserMenu; showBrushMenu = false"
              title="橡皮擦"
            >
              🧽
            </button>
            <!-- Eraser size dropdown -->
            <div v-if="showEraserMenu" class="size-menu eraser-menu">
              <div class="size-menu-title">橡皮擦大小</div>
              <button
                v-for="size in eraserSizes"
                :key="size"
                class="size-option"
                :class="{ active: eraserSize === size }"
                @click="eraserSize = size; showEraserMenu = false"
              >
                <span class="size-circle" :style="{ width: `${size}px`, height: `${size}px` }"></span>
                <span>{{ size }}px</span>
              </button>
            </div>
          </div>
          
          <button class="tool-btn" @click="clearDrawing" title="清除全部">
            🗑️
          </button>
          <button class="tool-btn" @click="isDrawing = false" title="关闭">
            ✕
          </button>
        </div>
      </Transition>
      
      <!-- Laser Pointer -->
      <div 
        v-if="isLaserPointer" 
        class="laser-pointer"
        :style="{ left: `${laserX}px`, top: `${laserY}px` }"
      />
    </div>
    
    <!-- Thumbnail Navigation -->
    <Transition name="fade">
      <div v-if="showThumbnailNav" class="thumbnail-nav-overlay" @click="showThumbnailNav = false">
        <div class="thumbnail-nav" @click.stop>
          <div class="thumbnail-header">
            <span>幻灯片导航</span>
            <button class="close-btn" @click="showThumbnailNav = false">×</button>
          </div>
          <div class="thumbnail-grid">
            <div
              v-for="(slide, index) in slides"
              :key="index"
              class="thumbnail-item"
              :class="{ active: index === currentIndex }"
              @click="goTo(index)"
            >
              <div class="thumbnail-number">{{ index + 1 }}</div>
              <div class="thumbnail-title">{{ getSlideTitle(slide) }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- Keyboard Hints -->
    <Transition name="fade">
      <div v-if="showKeyboardHints" class="keyboard-hints-overlay" @click="showKeyboardHints = false">
        <div class="keyboard-hints" @click.stop>
          <div class="hints-header">
            <span>键盘快捷键</span>
            <button class="close-btn" @click="showKeyboardHints = false">×</button>
          </div>
          <div class="hints-content">
            <div class="hint-row">
              <kbd>→</kbd> / <kbd>Space</kbd>
              <span>下一页</span>
            </div>
            <div class="hint-row">
              <kbd>←</kbd>
              <span>上一页</span>
            </div>
            <div class="hint-row">
              <kbd>Home</kbd>
              <span>第一页</span>
            </div>
            <div class="hint-row">
              <kbd>End</kbd>
              <span>最后一页</span>
            </div>
            <div class="hint-row">
              <kbd>F</kbd>
              <span>全屏模式</span>
            </div>
            <div class="hint-row">
              <kbd>S</kbd>
              <span>演讲者备注</span>
            </div>
            <div class="hint-row">
              <kbd>D</kbd>
              <span>画笔绘制</span>
            </div>
            <div class="hint-row">
              <kbd>L</kbd>
              <span>激光笔</span>
            </div>
            <div class="hint-row">
              <kbd>P</kbd>
              <span>演讲者模式</span>
            </div>
            <div class="hint-row">
              <kbd>G</kbd>
              <span>幻灯片导航</span>
            </div>
            <div class="hint-row">
              <kbd>Ctrl+Z</kbd>
              <span>撤销画笔</span>
            </div>
            <div class="hint-row">
              <kbd>Ctrl+Y</kbd>
              <span>重做画笔</span>
            </div>
            <div class="hint-row">
              <kbd>?</kbd>
              <span>显示帮助</span>
            </div>
            <div class="hint-row">
              <kbd>Esc</kbd>
              <span>关闭弹窗</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- Speaker Notes -->
    <Transition name="fade">
      <div v-if="showSpeakerNotes && currentSlide?.notes" class="speaker-notes">
        <div class="notes-header">
          <span>📝 演讲者备注</span>
          <button class="notes-close" @click="showSpeakerNotes = false">×</button>
        </div>
        <div class="notes-content">{{ currentSlide.notes }}</div>
      </div>
    </Transition>
    
    <SlideNav
      :current="currentIndex + 1"
      :total="totalSlides"
      :theme="currentTheme.name"
      @prev="goPrev"
      @next="goNext"
      @go-to="goTo"
      @toggle-theme="toggleTheme"
    />
    
    <!-- Floating Toolbar -->
    <Transition name="toolbar-fade">
      <Toolbar
        v-if="showToolbar"
        :is-drawing="isDrawing"
        :is-laser-pointer="isLaserPointer"
        :is-presenter-mode="isPresenterMode"
        :is-fullscreen="isFullscreen"
        :theme="currentTheme.name"
        @toggle-drawing="isDrawing = !isDrawing"
        @toggle-laser="isLaserPointer = !isLaserPointer"
        @open-presenter="openPresenterWindow"
        @toggle-fullscreen="toggleFullscreen"
        @toggle-theme="toggleTheme"
        @show-help="showKeyboardHints = true"
      />
    </Transition>
  </div>
</template>

<style>
.algoflow-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--af-background);
  color: var(--af-foreground);
  transition: background 0.5s ease, color 0.5s ease;
}

.slide-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Slide transition animations */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Toolbar fade transition */
.toolbar-fade-enter-active,
.toolbar-fade-leave-active {
  transition: all 0.3s ease;
}

.toolbar-fade-enter-from,
.toolbar-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Thumbnail Navigation */
.thumbnail-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.thumbnail-nav {
  background: var(--af-background);
  border-radius: 12px;
  padding: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.thumbnail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  color: var(--af-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.15);
}

.thumbnail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.thumbnail-item {
  padding: 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.thumbnail-item:hover {
  background: rgba(59, 130, 246, 0.1);
}

.thumbnail-item.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.thumbnail-number {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.thumbnail-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Keyboard Hints */
.keyboard-hints-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.keyboard-hints {
  background: var(--af-background);
  border-radius: 12px;
  padding: 24px;
  min-width: 320px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.hints-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.hints-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hint-row kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--af-foreground);
}

.hint-row span {
  color: #64748b;
  font-size: 14px;
}

/* Speaker Notes */
.speaker-notes {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 320px;
  max-height: 200px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.notes-close {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notes-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.notes-content {
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  overflow-y: auto;
  max-height: 140px;
}

/* Drawing Canvas */
.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 50;
  cursor: crosshair;
}

.drawing-toolbar {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.color-btn-wrapper {
  position: relative;
}

.color-btn {
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #333;
}

/* Eraser indicator */
.eraser-indicator {
  position: fixed;
  border: 2px dashed #333;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 60;
  background: rgba(255, 255, 255, 0.2);
}

.drawing-canvas.eraser-cursor {
  cursor: none;
}

/* Size menus */
.size-menu {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  margin-bottom: 8px;
  min-width: 100px;
  z-index: 200;
}

.size-menu-title {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  text-align: center;
}

.size-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
  transition: background 0.15s;
}

.size-option:hover {
  background: #f1f5f9;
}

.size-option.active {
  background: #dbeafe;
  color: #2563eb;
}

.size-preview {
  display: inline-block;
  width: 30px;
  border-radius: 2px;
}

.size-circle {
  display: inline-block;
  border-radius: 50%;
  background: #94a3b8;
}

.eraser-btn-wrapper {
  position: relative;
}

.tool-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.tool-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid #3b82f6;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(0, 0, 0, 0.15);
  margin: 0 4px;
}

/* Laser Pointer */
.laser-pointer {
  position: fixed;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, #ff0000 0%, #ff000080 50%, transparent 70%);
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 1000;
  box-shadow: 0 0 20px #ff0000, 0 0 40px #ff000080;
  animation: laser-pulse 1s ease-in-out infinite;
}

@keyframes laser-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
}

/* Presenter View */
.presenter-view {
  height: 100vh;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.presenter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
}

.presenter-title {
  font-size: 18px;
  font-weight: 600;
}

.presenter-timer {
  font-size: 24px;
  font-family: 'JetBrains Mono', monospace;
  color: #4ade80;
}

.presenter-content {
  flex: 1;
  display: flex;
  padding: 16px;
  gap: 16px;
  overflow: hidden;
}

.presenter-current {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.presenter-label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.presenter-slide-preview {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.presenter-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 300px;
}

.presenter-next {
  background: #16213e;
  border-radius: 12px;
  padding: 16px;
}

.presenter-next-preview {
  margin-top: 8px;
  padding: 12px;
  background: #0f3460;
  border-radius: 8px;
}

.next-title {
  font-size: 14px;
  color: #e2e8f0;
}

.presenter-notes {
  flex: 1;
  background: #16213e;
  border-radius: 12px;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notes-text {
  flex: 1;
  margin-top: 8px;
  padding: 12px;
  background: #0f3460;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: #e2e8f0;
  overflow-y: auto;
}
</style>
