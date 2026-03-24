import type { CanvasOptions, Shape, ShapeStyle, RectShape, CircleShape, LineShape, TextShape, PathShape, AnyShape } from './types'

/**
 * Canvas renderer for drawing shapes.
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private pixelRatio: number
  private backgroundColor: string
  private shapes: Map<string, AnyShape> = new Map()

  constructor(canvas: HTMLCanvasElement, options: CanvasOptions) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = options.width
    this.height = options.height
    this.pixelRatio = options.pixelRatio ?? window.devicePixelRatio
    this.backgroundColor = options.backgroundColor ?? 'transparent'

    this.setupCanvas()
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
   * Resize canvas.
   */
  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.setupCanvas()
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
    this.shapes.set(shape.id, shape)
  }

  /**
   * Remove a shape.
   */
  removeShape(id: string): boolean {
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
  }

  /**
   * Render all shapes.
   */
  render(): void {
    this.clear()
    this.shapes.forEach(shape => this.drawShape(shape))
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
}
