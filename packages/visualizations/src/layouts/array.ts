/**
 * Bar layout calculation result.
 */
export interface BarLayout {
  /** Index in array */
  index: number
  /** Value */
  value: number
  /** X position */
  x: number
  /** Y position */
  y: number
  /** Width */
  width: number
  /** Height */
  height: number
}

/**
 * Options for array layout calculation.
 */
export interface ArrayLayoutOptions {
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
  /** Bar width (auto if not specified) */
  barWidth?: number
  /** Gap between bars */
  gap?: number
  /** Padding around edges */
  padding?: number
  /** Maximum value for scaling (auto if not specified) */
  maxValue?: number
}

/**
 * Calculate bar layout for array visualization.
 */
export function calculateArrayLayout(
  data: number[],
  options: ArrayLayoutOptions
): BarLayout[] {
  const { width, height, gap = 2, padding = 20, maxValue: providedMaxValue } = options
  
  const n = data.length
  if (n === 0) return []

  const availableWidth = width - padding * 2
  const availableHeight = height - padding * 2
  
  // Calculate bar width if not provided
  const barWidth = options.barWidth ?? Math.max(4, (availableWidth - gap * (n - 1)) / n)
  
  // Calculate max value for scaling
  const maxValue = providedMaxValue ?? Math.max(...data, 1)

  const bars: BarLayout[] = []
  
  data.forEach((value, index) => {
    const barHeight = (value / maxValue) * availableHeight
    const x = padding + index * (barWidth + gap)
    const y = height - padding - barHeight // Bottom-aligned

    bars.push({
      index,
      value,
      x,
      y,
      width: barWidth,
      height: barHeight,
    })
  })

  return bars
}
