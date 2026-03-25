/**
 * 幻灯片指令解析器
 * 
 * 解析 HTML 注释格式的标签页指令：
 * - layout: 布局配置
 * - animation: 动画效果配置
 * - transition: 切换效果配置
 */

export interface LayoutConfig {
  align?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'center' | 'bottom'
  padding?: number | string
  maxWidth?: number | string
  backgroundColor?: string
}

export interface AnimationConfig {
  type?: 'fade-in' | 'slide-in' | 'zoom-in' | 'bounce-in' | 'none'
  duration?: number
  delay?: number
  easing?: string
  stagger?: number  // 子元素交错动画延迟
}

export interface TransitionConfig {
  type?: 'slide' | 'fade' | 'zoom' | 'flip' | 'none'
  duration?: number
  easing?: string
}

export interface SlideDirectives {
  title?: string
  section?: string
  notes?: string
  layout?: LayoutConfig
  animation?: AnimationConfig
  transition?: TransitionConfig
}

/**
 * 解析 HTML 注释中的指令
 * 
 * 支持格式：
 * - <!-- title: 标题 -->
 * - <!-- section: 章节 -->
 * - <!-- notes: 备注 -->
 * - <!-- layout: { "align": "center" } -->
 * - <!-- animation: { "type": "fade-in", "duration": 500 } -->
 * - <!-- transition: slide -->
 */
export function parseDirectives(content: string): { 
  directives: SlideDirectives
  cleanedContent: string 
} {
  const directives: SlideDirectives = {}
  let cleanedContent = content

  // 解析 title 指令
  const titleMatch = content.match(/<!--\s*title:\s*(.+?)\s*-->/)
  if (titleMatch) {
    directives.title = titleMatch[1].trim()
    cleanedContent = cleanedContent.replace(titleMatch[0], '')
  }

  // 解析 section 指令
  const sectionMatch = content.match(/<!--\s*section:\s*(.+?)\s*-->/)
  if (sectionMatch) {
    directives.section = sectionMatch[1].trim()
    cleanedContent = cleanedContent.replace(sectionMatch[0], '')
  }

  // 解析 notes 指令 (支持多行)
  const notesMatch = content.match(/<!--\s*notes:\s*([\s\S]*?)\s*-->/)
  if (notesMatch) {
    directives.notes = notesMatch[1].trim()
    cleanedContent = cleanedContent.replace(notesMatch[0], '')
  }

  // 解析 layout 指令 (JSON 格式)
  const layoutMatch = content.match(/<!--\s*layout:\s*({[\s\S]*?})\s*-->/)
  if (layoutMatch) {
    try {
      directives.layout = JSON.parse(layoutMatch[1])
    } catch (e) {
      console.warn('Failed to parse layout directive:', layoutMatch[1])
    }
    cleanedContent = cleanedContent.replace(layoutMatch[0], '')
  }

  // 解析 animation 指令 (JSON 格式或简单字符串)
  const animationMatch = content.match(/<!--\s*animation:\s*({[\s\S]*?}|[\w-]+)\s*-->/)
  if (animationMatch) {
    try {
      const value = animationMatch[1].trim()
      if (value.startsWith('{')) {
        directives.animation = JSON.parse(value)
      } else {
        // 简单字符串格式，如 <!-- animation: fade-in -->
        directives.animation = { type: value as AnimationConfig['type'] }
      }
    } catch (e) {
      console.warn('Failed to parse animation directive:', animationMatch[1])
    }
    cleanedContent = cleanedContent.replace(animationMatch[0], '')
  }

  // 解析 transition 指令 (JSON 格式或简单字符串)
  const transitionMatch = content.match(/<!--\s*transition:\s*({[\s\S]*?}|[\w-]+)\s*-->/)
  if (transitionMatch) {
    try {
      const value = transitionMatch[1].trim()
      if (value.startsWith('{')) {
        directives.transition = JSON.parse(value)
      } else {
        // 简单字符串格式，如 <!-- transition: slide -->
        directives.transition = { type: value as TransitionConfig['type'] }
      }
    } catch (e) {
      console.warn('Failed to parse transition directive:', transitionMatch[1])
    }
    cleanedContent = cleanedContent.replace(transitionMatch[0], '')
  }

  return { 
    directives, 
    cleanedContent: cleanedContent.trim() 
  }
}

/**
 * 预设动画配置
 */
export const ANIMATION_PRESETS: Record<string, AnimationConfig> = {
  'none': { type: 'none', duration: 0 },
  'fade-in': { type: 'fade-in', duration: 300, easing: 'ease-out' },
  'slide-in': { type: 'slide-in', duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  'zoom-in': { type: 'zoom-in', duration: 300, easing: 'ease-out' },
  'bounce-in': { type: 'bounce-in', duration: 500, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
}

/**
 * 预设过渡配置
 */
export const TRANSITION_PRESETS: Record<string, TransitionConfig> = {
  'none': { type: 'none', duration: 0 },
  'slide': { type: 'slide', duration: 350, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  'fade': { type: 'fade', duration: 300, easing: 'ease-in-out' },
  'zoom': { type: 'zoom', duration: 300, easing: 'ease-out' },
  'flip': { type: 'flip', duration: 400, easing: 'ease-in-out' },
}

/**
 * 获取完整的动画配置（合并预设）
 */
export function getAnimationConfig(config?: AnimationConfig): AnimationConfig {
  if (!config) {
    return ANIMATION_PRESETS['fade-in']
  }
  
  const preset = config.type ? ANIMATION_PRESETS[config.type] : {}
  return { ...preset, ...config }
}

/**
 * 获取完整的过渡配置（合并预设）
 */
export function getTransitionConfig(config?: TransitionConfig): TransitionConfig {
  if (!config) {
    return TRANSITION_PRESETS['slide']
  }
  
  const preset = config.type ? TRANSITION_PRESETS[config.type] : {}
  return { ...preset, ...config }
}

/**
 * 将 LayoutConfig 转换为 CSS 样式
 */
export function layoutToStyles(config?: LayoutConfig): Record<string, string> {
  const styles: Record<string, string> = {}
  
  if (!config) return styles
  
  if (config.align) {
    styles['text-align'] = config.align
  }
  if (config.verticalAlign) {
    styles['justify-content'] = config.verticalAlign === 'top' ? 'flex-start' 
      : config.verticalAlign === 'bottom' ? 'flex-end' : 'center'
  }
  if (config.padding !== undefined) {
    styles['padding'] = typeof config.padding === 'number' ? `${config.padding}px` : config.padding
  }
  if (config.maxWidth !== undefined) {
    styles['max-width'] = typeof config.maxWidth === 'number' ? `${config.maxWidth}px` : config.maxWidth
  }
  if (config.backgroundColor) {
    styles['background-color'] = config.backgroundColor
  }
  
  return styles
}
