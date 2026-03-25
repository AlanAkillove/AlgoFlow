import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * useDrawing Composable
 * 
 * 画笔绘制功能的完整状态管理，包括：
 * - 绘制状态（颜色、粗细、橡皮擦）
 * - 撤销/重做功能
 * - 画布初始化和清理
 * - 持久化存储
 */

export interface DrawingOptions {
  /** 最大历史记录数 */
  maxHistorySize?: number
  /** 是否启用持久化 */
  enablePersistence?: boolean
  /** 持久化 key 前缀 */
  storageKeyPrefix?: string
}

export function useDrawing(
  canvasRef: Ref<HTMLCanvasElement | null>,
  slideId: Ref<string | number>,
  options: DrawingOptions = {}
) {
  const {
    maxHistorySize = 50,
    enablePersistence = true,
    storageKeyPrefix = 'algoflow-drawing-'
  } = options

  // Basic state
  const isDrawing = ref(false)
  const isDrawingActive = ref(false)
  const isEraser = ref(false)
  const drawingColor = ref('#ff0000')
  const brushSize = ref(3)
  const eraserSize = ref(20)
  
  // Cursor position
  const lastX = ref(0)
  const lastY = ref(0)
  const eraserCursorX = ref(0)
  const eraserCursorY = ref(0)
  
  // History for undo/redo
  const history = ref<ImageData[]>([])
  const historyIndex = ref(-1)
  const canUndo = ref(false)
  const canRedo = ref(false)
  
  // Canvas context
  let ctx: CanvasRenderingContext2D | null = null

  /**
   * Initialize the drawing canvas
   */
  function initCanvas(): void {
    if (!canvasRef.value) return
    
    const canvas = canvasRef.value
    const container = canvas.parentElement
    if (!container) return

    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = brushSize.value
    }

    // Load persisted drawing
    if (enablePersistence) {
      loadFromStorage()
    }
    
    // Save initial state
    saveSnapshot()
  }

  /**
   * Start drawing
   */
  function startDrawing(e: MouseEvent): void {
    isDrawingActive.value = true
    const rect = canvasRef.value?.getBoundingClientRect()
    if (rect) {
      lastX.value = e.clientX - rect.left
      lastY.value = e.clientY - rect.top
    }
  }

  /**
   * Draw on canvas
   */
  function draw(e: MouseEvent): void {
    if (!isDrawingActive.value || !canvasRef.value || !ctx) return

    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Set eraser or drawing mode
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

  /**
   * Update eraser cursor position
   */
  function updateEraserCursor(e: MouseEvent): void {
    if (!isEraser.value || !isDrawing.value) return
    eraserCursorX.value = e.clientX
    eraserCursorY.value = e.clientY
  }

  /**
   * Stop drawing and save snapshot
   */
  function stopDrawing(): void {
    if (isDrawingActive.value) {
      isDrawingActive.value = false
      saveSnapshot()
      if (enablePersistence) {
        saveToStorage()
      }
    }
  }

  /**
   * Save current canvas state to history
   */
  function saveSnapshot(): void {
    if (!canvasRef.value || !ctx) return

    const imageData = ctx.getImageData(
      0, 
      0, 
      canvasRef.value.width, 
      canvasRef.value.height
    )

    // If we're not at the end of history, remove future states
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(imageData)
    
    // Limit history size
    if (history.value.length > maxHistorySize) {
      history.value.shift()
    } else {
      historyIndex.value++
    }

    updateUndoRedoState()
  }

  /**
   * Restore a snapshot from history
   */
  function restoreSnapshot(imageData: ImageData): void {
    if (!ctx || !canvasRef.value) return
    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * Update undo/redo availability
   */
  function updateUndoRedoState(): void {
    canUndo.value = historyIndex.value > 0
    canRedo.value = historyIndex.value < history.value.length - 1
  }

  /**
   * Undo last action
   */
  function undo(): void {
    if (historyIndex.value > 0) {
      historyIndex.value--
      restoreSnapshot(history.value[historyIndex.value])
      updateUndoRedoState()
      if (enablePersistence) {
        saveToStorage()
      }
    }
  }

  /**
   * Redo last undone action
   */
  function redo(): void {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      restoreSnapshot(history.value[historyIndex.value])
      updateUndoRedoState()
      if (enablePersistence) {
        saveToStorage()
      }
    }
  }

  /**
   * Clear the entire canvas
   */
  function clearCanvas(): void {
    if (!ctx || !canvasRef.value) return
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    saveSnapshot()
    if (enablePersistence) {
      saveToStorage()
    }
  }

  /**
   * Save drawing to localStorage
   */
  function saveToStorage(): void {
    if (!canvasRef.value) return
    
    try {
      const dataUrl = canvasRef.value.toDataURL('image/png')
      const key = `${storageKeyPrefix}${slideId.value}`
      localStorage.setItem(key, dataUrl)
    } catch (e) {
      console.warn('Failed to save drawing to storage:', e)
    }
  }

  /**
   * Load drawing from localStorage
   */
  function loadFromStorage(): void {
    if (!ctx || !canvasRef.value) return
    
    try {
      const key = `${storageKeyPrefix}${slideId.value}`
      const dataUrl = localStorage.getItem(key)
      
      if (dataUrl) {
        const img = new Image()
        img.onload = () => {
          ctx?.drawImage(img, 0, 0)
          saveSnapshot()
        }
        img.src = dataUrl
      }
    } catch (e) {
      console.warn('Failed to load drawing from storage:', e)
    }
  }

  /**
   * Clear storage for current slide
   */
  function clearStorage(): void {
    const key = `${storageKeyPrefix}${slideId.value}`
    localStorage.removeItem(key)
  }

  // Watch for slide changes to load persisted drawings
  watch(slideId, () => {
    if (isDrawing.value) {
      initCanvas()
    }
  })

  // Watch for drawing mode changes
  watch(isDrawing, (val) => {
    if (val) {
      // Reset history when entering drawing mode
      history.value = []
      historyIndex.value = -1
      updateUndoRedoState()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (enablePersistence) {
      saveToStorage()
    }
  })

  return {
    // State
    isDrawing,
    isDrawingActive,
    isEraser,
    drawingColor,
    brushSize,
    eraserSize,
    lastX,
    lastY,
    eraserCursorX,
    eraserCursorY,
    canUndo,
    canRedo,
    
    // Actions
    initCanvas,
    startDrawing,
    draw,
    updateEraserCursor,
    stopDrawing,
    undo,
    redo,
    clearCanvas,
    clearStorage,
    saveSnapshot,
  }
}
