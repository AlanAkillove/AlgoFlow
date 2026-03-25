/**
 * useApp - Main application composable
 * 
 * 整合所有应用级别的状态和逻辑
 */

import { ref, computed, watch, provide, onMounted, onUnmounted, nextTick } from 'vue'
import { 
  applyTheme, 
  lightTheme, 
  darkTheme, 
  type Theme,
  parseDirectives,
  type LayoutConfig,
  type AnimationConfig,
  type TransitionConfig,
  type SlideDirectives,
} from '@algoflow/core'

// Types
export interface SlideInfo {
  content: string
  frontmatter: Record<string, unknown>
  title: string
  sectionTitle?: string
  notes?: string
  layout?: LayoutConfig
  animation?: AnimationConfig
  transition?: TransitionConfig
}

// Constants
const TOOLBAR_TRIGGER_ZONE = 100
const TOOLBAR_HIDE_DELAY = 2000

export function useApp() {
  // ========== Slide State ==========
  const slides = ref<SlideInfo[]>([])
  const currentIndex = ref(0)
  const clickIndex = ref(0)
  const totalClicks = ref(0)

  const totalSlides = computed(() => slides.value.length)
  const currentSlide = computed(() => slides.value[currentIndex.value])
  const nextSlide = computed(() => {
    if (currentIndex.value < slides.value.length - 1) {
      return slides.value[currentIndex.value + 1]
    }
    return null
  })

  const globalTitle = computed(() => {
    if (slides.value.length > 0 && slides.value[0].frontmatter.title) {
      return String(slides.value[0].frontmatter.title)
    }
    return 'AlgoFlow Presentation'
  })

  // Reset click index when slide changes
  watch(currentIndex, () => {
    clickIndex.value = 0
  })

  // Provide click state to children
  provide('clickIndex', clickIndex)
  provide('totalClicks', totalClicks)

  // ========== Theme State ==========
  const currentTheme = ref<Theme>(lightTheme)
  const themes: Record<string, Theme> = { light: lightTheme, dark: darkTheme }

  function toggleTheme() {
    const newTheme = currentTheme.value.name === 'light' ? 'dark' : 'light'
    currentTheme.value = themes[newTheme]
    applyTheme(currentTheme.value)
  }

  // ========== UI State ==========
  const isFullscreen = ref(false)
  const showThumbnailNav = ref(false)
  const showKeyboardHints = ref(false)
  const showSpeakerNotes = ref(false)
  const showToolbar = ref(false)
  const hideToolbarTimer = ref<number | null>(null)
  const isMouseNearBottom = ref(false)

  // ========== Drawing State ==========
  const isDrawing = ref(false)
  const drawingCanvas = ref<HTMLCanvasElement | null>(null)
  const drawingColor = ref('#ff0000')
  const drawingColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#000000']
  const isDrawingActive = ref(false)
  const lastX = ref(0)
  const lastY = ref(0)
  const isEraser = ref(false)
  const eraserSize = ref(20)
  const eraserSizes = [10, 20, 30, 50]
  const brushSize = ref(3)
  const brushSizes = [1, 2, 3, 5, 8]
  const showEraserMenu = ref(false)
  const showBrushMenu = ref(false)
  const brushMenuColor = ref('')
  const eraserCursorX = ref(0)
  const eraserCursorY = ref(0)

  // Drawing history for undo/redo
  const drawingHistory = ref<ImageData[]>([])
  const historyIndex = ref(-1)

  // ========== Laser Pointer State ==========
  const isLaserPointer = ref(false)
  const laserX = ref(0)
  const laserY = ref(0)

  // ========== Presenter Mode State ==========
  const isPresenterMode = ref(false)
  const isPresenterWindow = ref(false)
  const presenterChannel = ref<BroadcastChannel | null>(null)
  const elapsedTime = ref(0)
  const timerInterval = ref<number | null>(null)

  // Check if this is a presenter window
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    isPresenterWindow.value = urlParams.get('presenter') === 'true'
  }

  // Export mode
  const isExportMode = ref(false)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    isExportMode.value = urlParams.get('export') === 'pdf'
  }

  // ========== Navigation Methods ==========
  function goNext() {
    if (clickIndex.value < totalClicks.value) {
      clickIndex.value++
      broadcastSlideChange()
      return
    }
    if (currentIndex.value < totalSlides.value - 1) {
      currentIndex.value++
      broadcastSlideChange()
    }
  }

  function goPrev() {
    if (clickIndex.value > 0) {
      clickIndex.value--
      broadcastSlideChange()
      return
    }
    if (currentIndex.value > 0) {
      currentIndex.value--
      broadcastSlideChange()
    }
  }

  function goTo(index: number) {
    if (index >= 0 && index < totalSlides.value) {
      currentIndex.value = index
      showThumbnailNav.value = false
    }
  }

  // ========== Fullscreen ==========
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      isFullscreen.value = true
    } else {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }

  // ========== Drawing Methods ==========
  function initDrawingCanvas() {
    if (!drawingCanvas.value) return
    const canvas = drawingCanvas.value
    const container = canvas.parentElement
    if (!container) return

    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = brushSize.value
    }
  }

  function startDrawing(e: MouseEvent) {
    isDrawingActive.value = true
    showEraserMenu.value = false
    showBrushMenu.value = false
    const rect = drawingCanvas.value?.getBoundingClientRect()
    if (rect) {
      lastX.value = e.clientX - rect.left
      lastY.value = e.clientY - rect.top
    }
  }

  function draw(e: MouseEvent) {
    if (!isDrawingActive.value || !drawingCanvas.value) return

    const canvas = drawingCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isEraser.value) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = eraserSize.value * 2
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = drawingColor.value
      ctx.lineWidth = brushSize.value
    }

    ctx.beginPath()
    ctx.moveTo(lastX.value, lastY.value)
    ctx.lineTo(x, y)
    ctx.stroke()

    lastX.value = x
    lastY.value = y
  }

  function updateEraserCursor(e: MouseEvent) {
    if (!isEraser.value || !isDrawing.value) return
    eraserCursorX.value = e.clientX
    eraserCursorY.value = e.clientY
  }

  function stopDrawing() {
    if (isDrawingActive.value) {
      isDrawingActive.value = false
      saveDrawingSnapshot()
    }
  }

  function clearDrawing() {
    if (!drawingCanvas.value) return
    const ctx = drawingCanvas.value.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
      drawingHistory.value = []
      historyIndex.value = -1
    }
  }

  function saveDrawingSnapshot() {
    if (!drawingCanvas.value) return
    const ctx = drawingCanvas.value.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
    
    if (historyIndex.value < drawingHistory.value.length - 1) {
      drawingHistory.value = drawingHistory.value.slice(0, historyIndex.value + 1)
    }
    
    drawingHistory.value.push(imageData)
    historyIndex.value = drawingHistory.value.length - 1
    
    // Limit history size
    if (drawingHistory.value.length > 50) {
      drawingHistory.value.shift()
      historyIndex.value--
    }
  }

  function undoDrawing() {
    if (historyIndex.value > 0 && drawingCanvas.value) {
      historyIndex.value--
      const ctx = drawingCanvas.value.getContext('2d')
      if (ctx) {
        ctx.putImageData(drawingHistory.value[historyIndex.value], 0, 0)
      }
    }
  }

  function redoDrawing() {
    if (historyIndex.value < drawingHistory.value.length - 1 && drawingCanvas.value) {
      historyIndex.value++
      const ctx = drawingCanvas.value.getContext('2d')
      if (ctx) {
        ctx.putImageData(drawingHistory.value[historyIndex.value], 0, 0)
      }
    }
  }

  // ========== Laser Pointer Methods ==========
  function updateLaserPosition(e: MouseEvent) {
    if (!isLaserPointer.value) return
    laserX.value = e.clientX
    laserY.value = e.clientY
  }

  // ========== Toolbar Visibility ==========
  function showToolbarOnMove(e: MouseEvent) {
    const windowHeight = window.innerHeight
    const mouseY = e.clientY
    const distanceFromBottom = windowHeight - mouseY

    const wasNearBottom = isMouseNearBottom.value
    isMouseNearBottom.value = distanceFromBottom <= TOOLBAR_TRIGGER_ZONE

    if (isMouseNearBottom.value) {
      showToolbar.value = true
      if (hideToolbarTimer.value) {
        clearTimeout(hideToolbarTimer.value)
        hideToolbarTimer.value = null
      }
    } else if (wasNearBottom && !isMouseNearBottom.value) {
      if (hideToolbarTimer.value) {
        clearTimeout(hideToolbarTimer.value)
      }
      hideToolbarTimer.value = window.setTimeout(() => {
        if (!isDrawing.value && !isLaserPointer.value && !isMouseNearBottom.value) {
          showToolbar.value = false
        }
      }, TOOLBAR_HIDE_DELAY)
    }
  }

  // Keep toolbar visible when drawing or using laser pointer
  watch([isDrawing, isLaserPointer], ([drawing, laser]) => {
    if (drawing || laser) {
      showToolbar.value = true
      if (hideToolbarTimer.value) {
        clearTimeout(hideToolbarTimer.value)
        hideToolbarTimer.value = null
      }
    }
  })

  // ========== Presenter Mode Methods ==========
  function openPresenterWindow() {
    const url = new URL(window.location.href)
    url.searchParams.set('presenter', 'true')
    window.open(url.toString(), 'algoflow-presenter', 'width=1280,height=720')
    isPresenterMode.value = true
  }

  function initPresenterChannel() {
    if (typeof BroadcastChannel === 'undefined') return

    presenterChannel.value = new BroadcastChannel('algoflow-sync')

    presenterChannel.value.onmessage = (event) => {
      const { type, data } = event.data

      if (type === 'slide-change' && isPresenterWindow.value) {
        currentIndex.value = data.index
        clickIndex.value = data.clickIndex
      }
    }
  }

  function broadcastSlideChange() {
    if (!presenterChannel.value) return

    presenterChannel.value.postMessage({
      type: 'slide-change',
      data: {
        index: currentIndex.value,
        clickIndex: clickIndex.value
      }
    })
  }

  function startTimer() {
    if (timerInterval.value) return
    timerInterval.value = window.setInterval(() => {
      elapsedTime.value++
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ========== Slide Loading ==========
  async function loadSlides() {
    const urlParams = new URLSearchParams(window.location.search)
    const fileParam = urlParams.get('file')
    const filePath = fileParam || '/slides/examples/sorting.md'

    console.log('Loading slides from:', filePath)

    const response = await fetch(filePath)
    const markdown = await response.text()

    const lines = markdown.split('\n')
    const parsedSlides: SlideInfo[] = []

    let currentSlideContent = ''
    let globalFrontmatter: Record<string, unknown> = {}
    let inFrontmatter = false
    let frontmatterLines: string[] = []
    let isFirstSlide = true

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      if (isFirstSlide && !inFrontmatter && trimmedLine === '---' && currentSlideContent.trim() === '') {
        inFrontmatter = true
        continue
      }

      if (inFrontmatter) {
        if (trimmedLine === '---') {
          inFrontmatter = false
          frontmatterLines.forEach(fmLine => {
            const [key, ...valueParts] = fmLine.split(':')
            if (key && valueParts.length) {
              globalFrontmatter[key.trim()] = valueParts.join(':').trim()
            }
          })
          continue
        }
        frontmatterLines.push(line)
        continue
      }

      if (trimmedLine === '---' && !inFrontmatter) {
        if (currentSlideContent.trim()) {
          const { directives, cleanedContent } = extractSlideDirectives(currentSlideContent.trim())
          
          // Extract title from heading if not specified in directives
          let title = directives.title || 'Untitled'
          if (title === 'Untitled') {
            const lines = cleanedContent.split('\n')
            for (const line of lines) {
              const match = line.match(/^(#{1,2})\s+(.+)$/)
              if (match) {
                title = match[2].trim()
                break
              }
            }
          }
          
          parsedSlides.push({
            content: cleanedContent,
            frontmatter: { ...globalFrontmatter },
            title,
            sectionTitle: directives.section,
            notes: directives.notes,
            layout: directives.layout,
            animation: directives.animation,
            transition: directives.transition,
          })
          currentSlideContent = ''
        }
        isFirstSlide = false
        continue
      }

      currentSlideContent += line + '\n'
    }

    if (currentSlideContent.trim()) {
      const { directives, cleanedContent } = extractSlideDirectives(currentSlideContent.trim())
      
      // Extract title from heading if not specified in directives
      let title = directives.title || 'Untitled'
      if (title === 'Untitled') {
        const lines = cleanedContent.split('\n')
        for (const line of lines) {
          const match = line.match(/^(#{1,2})\s+(.+)$/)
          if (match) {
            title = match[2].trim()
            break
          }
        }
      }
      
      parsedSlides.push({
        content: cleanedContent,
        frontmatter: { ...globalFrontmatter },
        title,
        sectionTitle: directives.section,
        notes: directives.notes,
        layout: directives.layout,
        animation: directives.animation,
        transition: directives.transition,
      })
    }

    slides.value = parsedSlides
    document.title = globalTitle.value
  }

  function extractSlideDirectives(content: string): { directives: SlideDirectives; cleanedContent: string } {
    return parseDirectives(content)
  }

  function getSlideTitle(slide: SlideInfo): string {
    return slide.title
  }

  function getSectionTitle(slide: SlideInfo): string | undefined {
    return slide.sectionTitle
  }

  // ========== Keyboard Handler ==========
  function handleKeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    // Undo: Ctrl+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undoDrawing()
      return
    }

    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      redoDrawing()
      return
    }

    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault()
      showKeyboardHints.value = !showKeyboardHints.value
      return
    }

    if (e.key === 'Escape') {
      if (showThumbnailNav.value) {
        showThumbnailNav.value = false
      } else if (showKeyboardHints.value) {
        showKeyboardHints.value = false
      }
      return
    }

    if (e.key === 'g' || e.key === 'G') {
      showThumbnailNav.value = !showThumbnailNav.value
      return
    }

    if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen()
      return
    }

    if (e.key === 's' || e.key === 'S') {
      showSpeakerNotes.value = !showSpeakerNotes.value
      return
    }

    if (e.key === 'd' || e.key === 'D') {
      isDrawing.value = !isDrawing.value
      return
    }

    if (e.key === 'l' || e.key === 'L') {
      isLaserPointer.value = !isLaserPointer.value
      return
    }

    if (e.key === 'p' || e.key === 'P') {
      openPresenterWindow()
      return
    }

    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault()
        goNext()
        break
      case 'ArrowLeft':
        goPrev()
        break
      case 'Home':
        goTo(0)
        break
      case 'End':
        goTo(totalSlides.value - 1)
        break
    }
  }

  // Fullscreen change handler
  function handleFullscreenChange() {
    isFullscreen.value = !!document.fullscreenElement
  }

  // ========== Lifecycle ==========
  onMounted(() => {
    loadSlides()
    applyTheme(currentTheme.value)
    window.addEventListener('keydown', handleKeydown)
    initPresenterChannel()

    if (isPresenterWindow.value) {
      startTimer()
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    stopTimer()
    if (presenterChannel.value) {
      presenterChannel.value.close()
    }
    if (hideToolbarTimer.value) {
      clearTimeout(hideToolbarTimer.value)
    }
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  })

  // Watch for drawing mode to init canvas
  watch(isDrawing, (val) => {
    if (val) {
      nextTick(() => {
        initDrawingCanvas()
        // Save initial state
        if (drawingCanvas.value) {
          const ctx = drawingCanvas.value.getContext('2d')
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
            drawingHistory.value = [imageData]
            historyIndex.value = 0
          }
        }
      })
    }
  })

  return {
    // Slide state
    slides,
    currentIndex,
    clickIndex,
    totalClicks,
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
    isMouseNearBottom,

    // Drawing state
    isDrawing,
    drawingCanvas,
    drawingColor,
    drawingColors,
    isDrawingActive,
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
    canUndo: computed(() => historyIndex.value > 0),
    canRedo: computed(() => historyIndex.value < drawingHistory.value.length - 1),

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
    getSectionTitle,
  }
}
