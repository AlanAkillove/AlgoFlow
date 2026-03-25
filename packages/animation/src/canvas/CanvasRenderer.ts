import type { CanvasOptions, Shape, ShapeStyle, RectShape, CircleShape, LineShape, TextShape, PathShape, AnyShape } from './types'

/**
 * Dirty rectangle for incremental rendering.
 */
interface DirtyRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Canvas renderer for drawing shapes with incremental update support.
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private pixelRatio: number
  private backgroundColor: string
  private shapes: Map<string, AnyShape> = new Map()
  
  // Incremental rendering support
  private dirtyRects: DirtyRect[] = []
  private offscreenCanvas: HTMLCanvasElement | null = null
  private offscreenCtx: CanvasRenderingContext2D | null = null
  private useIncrementalRendering: boolean = true
  private shapeBounds: Map<string, DirtyRect> = new Map()

  constructor(canvas: HTMLCanvasElement, options: CanvasOptions) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = options.width
    this.height = options.height
    this.pixelRatio = options.pixelRatio ?? window.devicePixelRatio
    this.backgroundColor = options.backgroundColor ?? 'transparent'
    this.useIncrementalRendering = options.useIncrementalRendering ?? true

    this.setupCanvas()
    
    // Initialize offscreen canvas for caching
    if (this.useIncrementalRendering) {
      this.initOffscreenCanvas()
    }
  }

  /**
   * Get canvas context.
   */
  get context(): CanvasRenderingContext2D {
    return this.ctx
  }

  /**
   * Setup canvas with proper dimensions.
   */
  private setupCanvas(): void {
    this.canvas.width = this.width * this.pixelRatio
    this.canvas.height = this.height * this.pixelRatio
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
    this.ctx.scale(this.pixelRatio, this.pixelRatio)
  }

  /**
   * Initialize offscreen canvas for caching static content.
   */
  private initOffscreenCanvas(): void {
    this.offscreenCanvas = document.createElement('canvas')
    this.offscreenCanvas.width = this.width * this.pixelRatio
    this.offscreenCanvas.height = this.height * this.pixelRatio
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!
    this.offscreenCtx.scale(this.pixelRatio, this.pixelRatio)
  }

  /**
   * Resize canvas.
   */
  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.setupCanvas()
    
    // Resize offscreen canvas too
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = this.width * this.pixelRatio
      this.offscreenCanvas.height = this.height * this.pixelRatio
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')!
      this.offscreenCtx.scale(this.pixelRatio, this.pixelRatio)
    }
    
    this.render()
  }

  /**
   * Clear canvas.
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
    if (this.backgroundColor !== 'transparent') {
      this.ctx.fillStyle = this.backgroundColor
      this.ctx.fillRect(0, 0, this.width, this.height)
    }
  }

  /**
   * Add or update a shape.
   */
  setShape(shape: AnyShape): void {
    const oldBounds = this.shapeBounds.get(shape.id)
    
    // Mark old bounds as dirty if shape existed
    if (oldBounds) {
      this.markDirty(oldBounds)
    }
    
    this.shapes.set(shape.id, shape)
    
    // Calculate and store new bounds
    const newBounds = this.calculateShapeBounds(shape)
    this.shapeBounds.set(shape.id, newBounds)
    
    // Mark new bounds as dirty
    this.markDirty(newBounds)
  }

  /**
   * Remove a shape.
   */
  removeShape(id: string): boolean {
    const bounds = this.shapeBounds.get(id)
    if (bounds) {
      this.markDirty(bounds)
      this.shapeBounds.delete(id)
    }
    return this.shapes.delete(id)
  }

  /**
   * Get a shape by id.
   */
  getShape(id: string): Shape | undefined {
    return this.shapes.get(id)
  }

  /**
   * Clear all shapes.
   */
  clearShapes(): void {
    this.shapes.clear()
    this.shapeBounds.clear()
    this.dirtyRects = []
  }

  /**
   * Mark a region as dirty for incremental rendering.
   */
  markDirty(rect: DirtyRect): void {
    // Expand rect with padding to account for stroke width
    const padding = 5
    this.dirtyRects.push({
      x: Math.max(0, rect.x - padding),
      y: Math.max(0, rect.y - padding),
      width: Math.min(this.width, rect.width + padding * 2),
      height: Math.min(this.height, rect.height + padding * 2),
    })
  }

  /**
   * Calculate bounding box for a shape.
   */
  private calculateShapeBounds(shape: Shape): DirtyRect {
    switch (shape.type) {
      case 'rect': {
        const s = shape as RectShape
        return { x: s.x, y: s.y, width: s.width, height: s.height }
      }
      case 'circle': {
        const s = shape as CircleShape
        return { 
          x: s.x - s.radius, 
          y: s.y - s.radius, 
          width: s.radius * 2, 
          height: s.radius * 2 
        }
      }
      case 'line': {
        const s = shape as LineShape
        const minX = Math.min(s.x, s.x2)
        const minY = Math.min(s.y, s.y2)
        const maxX = Math.max(s.x, s.x2)
        const maxY = Math.max(s.y, s.y2)
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
      }
      case 'text': {
        const s = shape as TextShape
        const fontSize = s.fontSize ?? 14
        // Approximate text bounds
        return { x: s.x - 50, y: s.y - fontSize, width: 100, height: fontSize * 1.5 }
      }
      case 'path': {
        // Use canvas bounds as fallback for complex paths
        return { x: 0, y: 0, width: this.width, height: this.height }
      }
      default:
        return { x: 0, y: 0, width: this.width, height: this.height }
    }
  }

  /**
   * Merge overlapping dirty rects for efficiency.
   */
  private mergeDirtyRects(): DirtyRect[] {
    if (this.dirtyRects.length === 0) return []
    if (this.dirtyRects.length === 1) return this.dirtyRects

    // Simple merge: combine all rects into one bounding rect
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const rect of this.dirtyRects) {
      minX = Math.min(minX, rect.x)
      minY = Math.min(minY, rect.y)
      maxX = Math.max(maxX, rect.x + rect.width)
      maxY = Math.max(maxY, rect.y + rect.height)
    }
    
    return [{ x: minX, y: minY, width: maxX - minX, height: maxY - minY }]
  }

  /**
   * Render all shapes (full render).
   */
  render(): void {
    this.clear()
    this.shapes.forEach(shape => this.drawShape(shape))
    this.dirtyRects = []
  }

  /**
   * Render only dirty regions (incremental render).
   */
  renderIncremental(): void {
    if (this.dirtyRects.length === 0) return

    const mergedRects = this.mergeDirtyRects()
    
    for (const rect of mergedRects) {
      // Clear only the dirty region
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.rect(rect.x, rect.y, rect.width, rect.height)
      this.ctx.clip()
      
      // Clear the region
      this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height)
      if (this.backgroundColor !== 'transparent') {
        this.ctx.fillStyle = this.backgroundColor
        this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
      }
      
      // Redraw shapes that intersect with this region
      this.shapes.forEach(shape => {
        const bounds = this.shapeBounds.get(shape.id)
        if (bounds && this.rectsIntersect(rect, bounds)) {
          this.drawShape(shape)
        }
      })
      
      this.ctx.restore()
    }
    
    this.dirtyRects = []
  }

  /**
   * Check if two rectangles intersect.
   */
  private rectsIntersect(a: DirtyRect, b: DirtyRect): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    )
  }

  /**
   * Draw a single shape.
   */
  private drawShape(shape: Shape): void {
    this.ctx.save()

    switch (shape.type) {
      case 'rect':
        this.drawRect(shape as RectShape)
        break
      case 'circle':
        this.drawCircle(shape as CircleShape)
        break
      case 'line':
        this.drawLine(shape as LineShape)
        break
      case 'text':
        this.drawText(shape as TextShape)
        break
      case 'path':
        this.drawPath(shape as PathShape)
        break
    }

    this.ctx.restore()
  }

  /**
   * Draw rectangle.
   */
  private drawRect(shape: RectShape): void {
    const { x, y, width, height, style } = shape

    this.applyStyle(style)

    if (style?.borderRadius) {
      this.roundRect(x, y, width, height, style.borderRadius)
      if (style.fill) this.ctx.fill()
      if (style.stroke) this.ctx.stroke()
    } else {
      if (style?.fill) {
        this.ctx.fillRect(x, y, width, height)
      }
      if (style?.stroke) {
        this.ctx.strokeRect(x, y, width, height)
      }
    }
  }

  /**
   * Draw circle.
   */
  private drawCircle(shape: CircleShape): void {
    const { x, y, radius, style } = shape

    this.applyStyle(style)
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)

    if (style?.fill) this.ctx.fill()
    if (style?.stroke) this.ctx.stroke()
  }

  /**
   * Draw line.
   */
  private drawLine(shape: LineShape): void {
    const { x, y, x2, y2, style } = shape

    this.applyStyle(style)
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
  }

  /**
   * Draw text.
   */
  private drawText(shape: TextShape): void {
    const { x, y, text, style, fontSize = 14, fontFamily = 'sans-serif', textAlign = 'center', textBaseline = 'middle' } = shape

    this.applyStyle(style)
    this.ctx.font = `${fontSize}px ${fontFamily}`
    this.ctx.textAlign = textAlign
    this.ctx.textBaseline = textBaseline

    if (style?.fill) {
      this.ctx.fillText(text, x, y)
    }
    if (style?.stroke) {
      this.ctx.strokeText(text, x, y)
    }
  }

  /**
   * Draw path.
   */
  private drawPath(shape: PathShape): void {
    const { d, style } = shape

    this.applyStyle(style)
    const path = new Path2D(d)

    if (style?.fill) this.ctx.fill(path)
    if (style?.stroke) this.ctx.stroke(path)
  }

  /**
   * Apply style to context.
   */
  private applyStyle(style?: ShapeStyle): void {
    if (!style) return

    if (style.fill) this.ctx.fillStyle = style.fill
    if (style.stroke) this.ctx.strokeStyle = style.stroke
    if (style.strokeWidth !== undefined) this.ctx.lineWidth = style.strokeWidth
    if (style.opacity !== undefined) this.ctx.globalAlpha = style.opacity
  }

  /**
   * Draw rounded rectangle path.
   */
  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
  }

  /**
   * Draw a single shape immediately (not stored).
   */
  drawImmediate(shape: Shape): void {
    this.drawShape(shape)
  }

  /**
   * Create a snapshot of current canvas.
   */
  toDataURL(type = 'image/png'): string {
    return this.canvas.toDataURL(type)
  }

  /**
   * Destroy renderer and free resources.
   */
  destroy(): void {
    this.shapes.clear()
    this.shapeBounds.clear()
    this.dirtyRects = []
    this.offscreenCanvas = null
    this.offscreenCtx = null
  }
}
