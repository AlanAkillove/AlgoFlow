import { describe, it, expect } from 'vitest'
import { 
  parseDirectives, 
  getAnimationConfig, 
  getTransitionConfig, 
  layoutToStyles,
  ANIMATION_PRESETS,
  TRANSITION_PRESETS,
} from './directives'

describe('parseDirectives', () => {
  it('should parse title directive', () => {
    const content = '<!-- title: Hello World -->\n# Content'
    const { directives, cleanedContent } = parseDirectives(content)
    
    expect(directives.title).toBe('Hello World')
    expect(cleanedContent).toBe('# Content')
  })

  it('should parse section directive', () => {
    const content = '<!-- section: Chapter 1 -->\n## Section'
    const { directives } = parseDirectives(content)
    
    expect(directives.section).toBe('Chapter 1')
  })

  it('should parse notes directive', () => {
    const content = '<!-- notes: Speaker notes here -->\n# Slide'
    const { directives } = parseDirectives(content)
    
    expect(directives.notes).toBe('Speaker notes here')
  })

  it('should parse multi-line notes', () => {
    const content = `<!-- notes: 
This is line 1
This is line 2
-->\n# Slide`
    const { directives } = parseDirectives(content)
    
    expect(directives.notes).toContain('line 1')
    expect(directives.notes).toContain('line 2')
  })

  it('should parse layout directive with JSON', () => {
    const content = '<!-- layout: { "align": "center", "padding": 40 } -->\n# Centered'
    const { directives } = parseDirectives(content)
    
    expect(directives.layout).toEqual({
      align: 'center',
      padding: 40,
    })
  })

  it('should parse animation directive with simple string', () => {
    const content = '<!-- animation: fade-in -->\n# Animated'
    const { directives } = parseDirectives(content)
    
    expect(directives.animation).toEqual({
      type: 'fade-in',
    })
  })

  it('should parse animation directive with JSON', () => {
    const content = '<!-- animation: { "type": "slide-in", "duration": 500 } -->\n# Animated'
    const { directives } = parseDirectives(content)
    
    expect(directives.animation).toEqual({
      type: 'slide-in',
      duration: 500,
    })
  })

  it('should parse transition directive with simple string', () => {
    const content = '<!-- transition: slide -->\n# Slide'
    const { directives } = parseDirectives(content)
    
    expect(directives.transition).toEqual({
      type: 'slide',
    })
  })

  it('should parse transition directive with JSON', () => {
    const content = '<!-- transition: { "type": "zoom", "duration": 400 } -->\n# Slide'
    const { directives } = parseDirectives(content)
    
    expect(directives.transition).toEqual({
      type: 'zoom',
      duration: 400,
    })
  })

  it('should parse multiple directives', () => {
    const content = `<!-- title: Test -->
<!-- layout: { "align": "center" } -->
<!-- animation: fade-in -->
<!-- transition: slide -->
# Content`
    const { directives, cleanedContent } = parseDirectives(content)
    
    expect(directives.title).toBe('Test')
    expect(directives.layout).toEqual({ align: 'center' })
    expect(directives.animation).toEqual({ type: 'fade-in' })
    expect(directives.transition).toEqual({ type: 'slide' })
    expect(cleanedContent).toBe('# Content')
  })

  it('should return empty directives for content without directives', () => {
    const content = '# Just content\nNo directives here'
    const { directives } = parseDirectives(content)
    
    expect(directives).toEqual({})
  })

  it('should handle invalid JSON gracefully', () => {
    const content = '<!-- layout: { invalid json } -->\n# Content'
    const { directives } = parseDirectives(content)
    
    // Invalid JSON should not crash, just not parse
    expect(directives.layout).toBeUndefined()
  })
})

describe('getAnimationConfig', () => {
  it('should return default config when no config provided', () => {
    const config = getAnimationConfig()
    
    expect(config.type).toBe('fade-in')
    expect(config.duration).toBeGreaterThan(0)
  })

  it('should merge with preset', () => {
    const config = getAnimationConfig({ type: 'slide-in' })
    
    expect(config.type).toBe('slide-in')
    expect(config.duration).toBe(ANIMATION_PRESETS['slide-in'].duration)
  })

  it('should override preset values', () => {
    const config = getAnimationConfig({ 
      type: 'fade-in', 
      duration: 1000 
    })
    
    expect(config.type).toBe('fade-in')
    expect(config.duration).toBe(1000)
  })

  it('should handle none type', () => {
    const config = getAnimationConfig({ type: 'none' })
    
    expect(config.type).toBe('none')
    expect(config.duration).toBe(0)
  })
})

describe('getTransitionConfig', () => {
  it('should return default config when no config provided', () => {
    const config = getTransitionConfig()
    
    expect(config.type).toBe('slide')
  })

  it('should merge with preset', () => {
    const config = getTransitionConfig({ type: 'zoom' })
    
    expect(config.type).toBe('zoom')
    expect(config.duration).toBe(TRANSITION_PRESETS['zoom'].duration)
  })

  it('should override preset values', () => {
    const config = getTransitionConfig({ 
      type: 'fade', 
      duration: 500 
    })
    
    expect(config.type).toBe('fade')
    expect(config.duration).toBe(500)
  })
})

describe('layoutToStyles', () => {
  it('should return empty object for undefined config', () => {
    const styles = layoutToStyles()
    
    expect(styles).toEqual({})
  })

  it('should convert align to text-align', () => {
    const styles = layoutToStyles({ align: 'center' })
    
    expect(styles['text-align']).toBe('center')
  })

  it('should convert verticalAlign to justify-content', () => {
    const styles = layoutToStyles({ verticalAlign: 'center' })
    
    expect(styles['justify-content']).toBe('center')
  })

  it('should convert padding number to pixels', () => {
    const styles = layoutToStyles({ padding: 40 })
    
    expect(styles['padding']).toBe('40px')
  })

  it('should keep padding as string', () => {
    const styles = layoutToStyles({ padding: '2rem' })
    
    expect(styles['padding']).toBe('2rem')
  })

  it('should convert maxWidth number to pixels', () => {
    const styles = layoutToStyles({ maxWidth: 800 })
    
    expect(styles['max-width']).toBe('800px')
  })

  it('should convert backgroundColor', () => {
    const styles = layoutToStyles({ backgroundColor: '#f5f5f5' })
    
    expect(styles['background-color']).toBe('#f5f5f5')
  })

  it('should handle multiple properties', () => {
    const styles = layoutToStyles({
      align: 'right',
      padding: 20,
      backgroundColor: 'transparent',
    })
    
    expect(styles).toEqual({
      'text-align': 'right',
      'padding': '20px',
      'background-color': 'transparent',
    })
  })
})
