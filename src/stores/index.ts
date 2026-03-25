import { reactive, readonly, computed } from 'vue'
import type { SlideInfo } from '../composables/useSlides'

/**
 * Global State Store
 * 
 * 集中管理应用状态，提供响应式数据和操作方法
 */

// State interface
interface AppState {
  // Slides
  slides: SlideInfo[]
  currentIndex: number
  clickIndex: number
  totalClicks: number
  
  // Theme
  theme: 'light' | 'dark'
  
  // UI
  isFullscreen: boolean
  showThumbnailNav: boolean
  showKeyboardHints: boolean
  showSpeakerNotes: boolean
  showToolbar: boolean
  
  // Drawing
  isDrawing: boolean
  isLaserPointer: boolean
  drawingColor: string
  brushSize: number
  eraserSize: number
  isEraser: boolean
  
  // Presenter
  isPresenterMode: boolean
  isPresenterWindow: boolean
  elapsedTime: number
}

// Initial state
const initialState: AppState = {
  slides: [],
  currentIndex: 0,
  clickIndex: 0,
  totalClicks: 0,
  theme: 'light',
  isFullscreen: false,
  showThumbnailNav: false,
  showKeyboardHints: false,
  showSpeakerNotes: false,
  showToolbar: true,
  isDrawing: false,
  isLaserPointer: false,
  drawingColor: '#ff0000',
  brushSize: 3,
  eraserSize: 20,
  isEraser: false,
  isPresenterMode: false,
  isPresenterWindow: false,
  elapsedTime: 0,
}

// Reactive state
const state = reactive<AppState>({ ...initialState })

// Computed
const totalSlides = computed(() => state.slides.length)
const currentSlide = computed(() => state.slides[state.currentIndex] || null)
const nextSlide = computed(() => state.slides[state.currentIndex + 1] || null)
const isFirstSlide = computed(() => state.currentIndex === 0)
const isLastSlide = computed(() => state.currentIndex >= state.slides.length - 1)
const hasMoreClicks = computed(() => state.clickIndex < state.totalClicks)

// Actions
const actions = {
  // Slides
  setSlides(slides: SlideInfo[]) {
    state.slides = slides
  },
  
  setCurrentIndex(index: number) {
    state.currentIndex = index
  },
  
  setClickIndex(index: number) {
    state.clickIndex = index
  },
  
  setTotalClicks(count: number) {
    state.totalClicks = count
  },
  
  // Navigation
  nextSlide() {
    if (state.clickIndex < state.totalClicks) {
      state.clickIndex++
      return true
    }
    if (state.currentIndex < state.slides.length - 1) {
      state.currentIndex++
      state.clickIndex = 0
      return true
    }
    return false
  },
  
  prevSlide() {
    if (state.clickIndex > 0) {
      state.clickIndex--
      return true
    }
    if (state.currentIndex > 0) {
      state.currentIndex--
      state.clickIndex = 0
      return true
    }
    return false
  },
  
  goToSlide(index: number) {
    if (index >= 0 && index < state.slides.length) {
      state.currentIndex = index
      state.clickIndex = 0
      state.showThumbnailNav = false
    }
  },
  
  // Theme
  setTheme(theme: 'light' | 'dark') {
    state.theme = theme
  },
  
  toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light'
  },
  
  // UI
  setFullscreen(value: boolean) {
    state.isFullscreen = value
  },
  
  toggleThumbnailNav() {
    state.showThumbnailNav = !state.showThumbnailNav
  },
  
  toggleKeyboardHints() {
    state.showKeyboardHints = !state.showKeyboardHints
  },
  
  toggleSpeakerNotes() {
    state.showSpeakerNotes = !state.showSpeakerNotes
  },
  
  setToolbarVisible(value: boolean) {
    state.showToolbar = value
  },
  
  // Drawing
  setDrawing(value: boolean) {
    state.isDrawing = value
  },
  
  toggleDrawing() {
    state.isDrawing = !state.isDrawing
  },
  
  setLaserPointer(value: boolean) {
    state.isLaserPointer = value
  },
  
  toggleLaserPointer() {
    state.isLaserPointer = !state.isLaserPointer
  },
  
  setDrawingColor(color: string) {
    state.drawingColor = color
  },
  
  setBrushSize(size: number) {
    state.brushSize = size
  },
  
  setEraserSize(size: number) {
    state.eraserSize = size
  },
  
  setIsEraser(value: boolean) {
    state.isEraser = value
  },
  
  toggleEraser() {
    state.isEraser = !state.isEraser
  },
  
  // Presenter
  setPresenterMode(value: boolean) {
    state.isPresenterMode = value
  },
  
  setPresenterWindow(value: boolean) {
    state.isPresenterWindow = value
  },
  
  setElapsedTime(time: number) {
    state.elapsedTime = time
  },
  
  incrementElapsedTime() {
    state.elapsedTime++
  },
  
  resetElapsedTime() {
    state.elapsedTime = 0
  },
  
  // Reset
  reset() {
    Object.assign(state, initialState)
  },
}

// Export store
export const store = {
  state: readonly(state),
  computed: {
    totalSlides,
    currentSlide,
    nextSlide,
    isFirstSlide,
    isLastSlide,
    hasMoreClicks,
  },
  ...actions,
}

// Export types
export type { AppState }
