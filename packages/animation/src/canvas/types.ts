/**
 * Canvas renderer configuration options.
 */
export interface CanvasOptions {
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
  /** Device pixel ratio (default: window.devicePixelRatio) */
  pixelRatio?: number
  /** Background color */
  backgroundColor?: string
  /** Enable incremental rendering for better performance (default: true) */
  useIncrementalRendering?: boolean
}

/**
 * Shape style configuration.
 */
export interface ShapeStyle {
  /** Fill color */
  fill?: string
  /** Stroke color */
  stroke?: string
  /** Stroke width */
  strokeWidth?: number
  /** Opacity (0-1) */
  opacity?: number
  /** Border radius (for rectangles) */
  borderRadius?: number
}

/**
 * Base shape interface.
 */
export interface Shape {
  /** Unique identifier */
  id: string
  /** Shape type */
  type: 'rect' | 'circle' | 'line' | 'text' | 'path'
  /** X position */
  x: number
  /** Y position */
  y: number
  /** Style overrides */
  style?: ShapeStyle
  /** Additional data */
  data?: Record<string, unknown>
}

/**
 * Rectangle shape.
 */
export interface RectShape extends Shape {
  type: 'rect'
  /** Width */
  width: number
  /** Height */
  height: number
}

/**
 * Circle shape.
 */
export interface CircleShape extends Shape {
  type: 'circle'
  /** Radius */
  radius: number
}

/**
 * Line shape.
 */
export interface LineShape extends Shape {
  type: 'line'
  /** End X position */
  x2: number
  /** End Y position */
  y2: number
}

/**
 * Text shape.
 */
export interface TextShape extends Shape {
  type: 'text'
  /** Text content */
  text: string
  /** Font size */
  fontSize?: number
  /** Font family */
  fontFamily?: string
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right'
  /** Text baseline */
  textBaseline?: 'top' | 'middle' | 'bottom'
}

/**
 * Path shape.
 */
export interface PathShape extends Shape {
  type: 'path'
  /** SVG path data */
  d: string
}

/**
 * Union type for all shape types.
 */
export type AnyShape = RectShape | CircleShape | LineShape | TextShape | PathShape
