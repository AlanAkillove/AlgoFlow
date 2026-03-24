<script setup lang="ts">
import { h, resolveComponent, type VNode, ref, onMounted, watch, computed, inject, type Ref, nextTick } from 'vue'
import { marked, type Tokens } from 'marked'
import { codeToHtml, createHighlighter, type Highlighter } from 'shiki'
import { transformerNotationDiff, transformerNotationFocus } from '@shikijs/transformers'

const props = defineProps<{
  content: string
  frontmatter: Record<string, unknown>
  exportMode?: boolean
}>()

// Inject click animation state from parent
const clickIndex = inject<Ref<number>>('clickIndex', ref(0))
const totalClicks = inject<Ref<number>>('totalClicks', ref(0))

// Shiki highlighter instance
const highlighter = ref<Highlighter | null>(null)
const isReady = ref(false)
const slideContentRef = ref<HTMLElement | null>(null)

// Initialize highlighter
onMounted(async () => {
  try {
    highlighter.value = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['javascript', 'typescript', 'python', 'cpp', 'java', 'json', 'markdown', 'vue', 'html', 'css', 'bash', 'shell'],
    })
    isReady.value = true
  } catch (e) {
    console.error('Failed to initialize Shiki:', e)
  }
})

// Update v-click visibility when clickIndex changes
watch(clickIndex, () => {
  nextTick(() => {
    if (!slideContentRef.value) return
    const groups = slideContentRef.value.querySelectorAll('.v-click-group')
    groups.forEach((el) => {
      const clickNum = parseInt((el as HTMLElement).dataset.click || '0')
      if (clickNum <= clickIndex.value) {
        el.classList.add('v-click-visible')
      } else {
        el.classList.remove('v-click-visible')
      }
    })
  })
}, { immediate: true })

// Escape HTML for fallback
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Custom code renderer with Shiki
async function highlightCode(code: string, lang: string): Promise<string> {
  if (!highlighter.value) {
    return `<pre class="shiki fallback typewriter"><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
  }
  
  try {
    const html = await codeToHtml(code, {
      lang: lang || 'text',
      theme: 'github-dark',
      transformers: [
        // Add line class to each line
        {
          name: 'add-lines',
          code(node) {
            // Wrap content in line spans
            const lines = node.children
            node.children = lines.map((line) => ({
              type: 'element',
              tagName: 'span',
              properties: { class: 'line' },
              children: [line]
            }))
          }
        },
        {
          name: 'add-typewriter',
          pre(node) {
            node.properties = node.properties || {}
            node.properties.class = 'shiki typewriter'
          }
        }
      ]
    })
    return html
  } catch (e) {
    console.warn('Shiki highlight failed:', e)
    return `<pre class="shiki fallback typewriter"><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
  }
}

// Parsed content segments
interface ContentSegment {
  type: 'html' | 'component'
  content?: string
  component?: string
  props?: Record<string, unknown>
}

// Parse component tags from content (supports both <Component /> and ```algoflow blocks)
function parseComponentTags(markdown: string): { markdown: string; components: ContentSegment[] } {
  const components: ContentSegment[] = []
  
  // Match self-closing component tags like <ArrayViz :data="[1,2,3]" />
  // Support multi-line attributes with [\s\S]*?
  const componentRegex = /<(ArrayViz|TreeViz|GraphViz|PlayerControls)([\s\S]*?)\/>/g
  
  let processedMarkdown = markdown
  let match
  
  // Parse <Component /> style tags
  while ((match = componentRegex.exec(markdown)) !== null) {
    const fullMatch = match[0]
    const componentName = match[1]
    const propsStr = match[2]
    
    // Parse props
    const componentProps: Record<string, unknown> = {}
    
    // Match :prop="value" or prop="value" - support multi-line
    const propRegex = /(:)?([\w-]+)="([^"]*)"/g
    let propMatch
    while ((propMatch = propRegex.exec(propsStr)) !== null) {
      const isBinding = propMatch[1] === ':'
      const key = propMatch[2]
      const value = propMatch[3]
      
      if (isBinding) {
        // Try to parse as JavaScript expression
        try {
          componentProps[key] = new Function(`return (${value})`)()
        } catch {
          componentProps[key] = value
        }
      } else {
        componentProps[key] = value
      }
    }
    
    // Replace with placeholder
    const placeholder = `[[COMPONENT_${components.length}]]`
    processedMarkdown = processedMarkdown.replace(fullMatch, placeholder)
    
    components.push({
      type: 'component',
      component: componentName,
      props: componentProps,
    })
  }
  
  // Parse ```algoflow code blocks
  // Use \r?\n to handle different line endings (Windows/Unix)
  const algoflowRegex = /```algoflow\r?\n([\s\S]*?)```/g
  const algoflowMatches = [...processedMarkdown.matchAll(algoflowRegex)]
  
  // Process matches in reverse order to preserve indices
  for (let i = algoflowMatches.length - 1; i >= 0; i--) {
    const match = algoflowMatches[i]
    const fullMatch = match[0]
    const jsonContent = match[1].trim()
    const startIndex = match.index!
    
    try {
      const config = JSON.parse(jsonContent)
      const componentName = getComponentName(config.type)
      
      if (componentName) {
        const placeholder = `[[COMPONENT_${components.length}]]`
        processedMarkdown = processedMarkdown.substring(0, startIndex) + placeholder + processedMarkdown.substring(startIndex + fullMatch.length)
        
        components.push({
          type: 'component',
          component: componentName,
          props: {
            data: config.data,
            steps: config.steps || [],
          },
        })
      }
    } catch (e) {
      console.error('Failed to parse algoflow block:', e)
      // Keep the original block if parsing fails
    }
  }
  
  return { markdown: processedMarkdown, components }
}

// Get component name from visualization type
function getComponentName(type: string): string | null {
  const typeMap: Record<string, string> = {
    'array': 'ArrayViz',
    'tree': 'TreeViz',
    'graph': 'GraphViz',
  }
  return typeMap[type] || null
}

// Reactive content
const contentSegments = ref<ContentSegment[]>([])
const isLoading = ref(true)

// Process markdown with async code highlighting
async function processMarkdown(markdown: string): Promise<string> {
  const tokens = marked.lexer(markdown)
  let html = ''
  
  for (const token of tokens) {
    if (token.type === 'code') {
      const codeToken = token as Tokens.Code
      const lang = codeToken.lang || 'text'
      html += await highlightCode(codeToken.text, lang)
    } else {
      // Use marked.parser for other tokens
      html += marked.parser([token])
    }
  }
  
  return html
}

// Parse v-click tags and wrap content in groups
function parseVClicks(html: string): { html: string; count: number } {
  let clickCount = 0
  
  // Split by v-click markers
  const parts = html.split(/<v-click\s*\/>/gi)
  
  if (parts.length <= 1) {
    // No v-click markers
    return { html, count: 0 }
  }
  
  // First part is always visible (no click needed)
  let result = parts[0]
  
 // Wrap subsequent parts in click groups
  for (let i = 1; i < parts.length; i++) {
    clickCount++
    result += `<div class="v-click-group" data-click="${clickCount}">${parts[i]}</div>`
  }
  
  return { html: result, count: clickCount }
}

// Watch for content changes
watch([() => props.content, isReady], async () => {
  if (!props.content) {
    contentSegments.value = []
    totalClicks.value = 0
    return
  }
  
  isLoading.value = true
  
  try {
    // In export mode, don't parse component tags - keep as code blocks
    let processedMarkdown = props.content
    let components: ContentSegment[] = []
    
    if (!props.exportMode) {
      const parsed = parseComponentTags(props.content)
      processedMarkdown = parsed.markdown
      components = parsed.components
    } else {
      // In export mode, replace algoflow blocks with placeholder message
      processedMarkdown = props.content.replace(
        /```algoflow\n[\s\S]*?```/g,
        '*(可视化内容 - 在演示模式下查看)*'
      )
    }
    
    // Process markdown with code highlighting
    let html: string
    if (isReady.value && highlighter.value) {
      html = await processMarkdown(processedMarkdown)
    } else {
      // Fallback without highlighting
      html = marked.parse(processedMarkdown) as string
    }
    
    // Parse v-click tags and update total clicks
    const { html: processedHtml, count } = parseVClicks(html)
    totalClicks.value = count
    
    // Split by component placeholders
    const segments: ContentSegment[] = []
    const parts = processedHtml.split(/\[\[COMPONENT_(\d+)\]\]/)
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        if (parts[i].trim()) {
          segments.push({ type: 'html', content: parts[i] })
        }
      } else {
        const componentIndex = parseInt(parts[i])
        if (components[componentIndex]) {
          segments.push(components[componentIndex])
        }
      }
    }
    
    contentSegments.value = segments
  } catch (e) {
    console.error('Error processing markdown:', e)
  } finally {
    isLoading.value = false
  }
}, { immediate: true })

// Render function for dynamic content
function renderSegment(segment: ContentSegment): VNode {
  if (segment.type === 'html') {
    return h('div', { innerHTML: segment.content, class: 'html-segment' })
  } else {
    try {
      const component = resolveComponent(segment.component!)
      return h(component, segment.props)
    } catch (e) {
      console.error('Failed to resolve component:', segment.component, e)
      return h('div', { class: 'component-error' }, `Unknown component: ${segment.component}`)
    }
  }
}
</script>

<template>
  <div 
    class="slide-renderer" 
    :class="frontmatter.layout ? `layout-${frontmatter.layout}` : ''"
  >
    <div class="slide-content" ref="slideContentRef">
      <template v-for="(segment, index) in contentSegments" :key="index">
        <component :is="() => renderSegment(segment)" />
      </template>
    </div>
  </div>
</template>

<style>
.slide-renderer {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.layout-center .slide-content {
  text-align: center;
}

/* Code blocks should always be left-aligned */
.layout-center .slide-content pre,
.layout-center .slide-content .shiki {
  text-align: left;
}

.slide-content {
  max-width: 1200px;
  width: 100%;
  font-size: 24px;
  line-height: 1.6;
}

/* v-click animation groups */
.v-click-group {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.v-click-group.v-click-visible {
  opacity: 1;
  transform: translateY(0);
}

.v-click-group[data-click="1"] { transition-delay: 0s; }
.v-click-group[data-click="2"] { transition-delay: 0.05s; }
.v-click-group[data-click="3"] { transition-delay: 0.1s; }
.v-click-group[data-click="4"] { transition-delay: 0.15s; }
.v-click-group[data-click="5"] { transition-delay: 0.2s; }
.v-click-group[data-click="6"] { transition-delay: 0.25s; }
.v-click-group[data-click="7"] { transition-delay: 0.3s; }
.v-click-group[data-click="8"] { transition-delay: 0.35s; }
.v-click-group[data-click="9"] { transition-delay: 0.4s; }
.v-click-group[data-click="10"] { transition-delay: 0.45s; }

/* Content entrance animations - staggered for each direct child */
.slide-content > * {
  opacity: 0;
  animation: contentFadeIn 0.5s ease-out forwards;
}

/* Ensure headings also animate */
.slide-content > h1,
.slide-content > h2,
.slide-content > h3 {
  opacity: 0;
  animation: contentFadeIn 0.5s ease-out forwards;
}

/* Ensure paragraphs animate */
.slide-content > p {
  opacity: 0;
  animation: contentFadeIn 0.5s ease-out forwards;
}

/* Lists animate as a whole, with items staggering inside */
.slide-content > ul,
.slide-content > ol {
  opacity: 0;
  animation: contentFadeIn 0.5s ease-out forwards;
}

/* Stagger each direct child element */
.slide-content > *:nth-child(1) { animation-delay: 0.05s; }
.slide-content > *:nth-child(2) { animation-delay: 0.15s; }
.slide-content > *:nth-child(3) { animation-delay: 0.25s; }
.slide-content > *:nth-child(4) { animation-delay: 0.70s; }
.slide-content > *:nth-child(5) { animation-delay: 0.80s; }
.slide-content > *:nth-child(6) { animation-delay: 0.90s; }
.slide-content > *:nth-child(7) { animation-delay: 1.00s; }
.slide-content > *:nth-child(8) { animation-delay: 1.10s; }
.slide-content > *:nth-child(9) { animation-delay: 1.20s; }
.slide-content > *:nth-child(10) { animation-delay: 1.30s; }
.slide-content > *:nth-child(n+11) { animation-delay: 1.40s; }

@keyframes contentFadeIn {
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Staggered animation for list items - within list animation */
.slide-content ul li,
.slide-content ol li {
  animation: listItemFadeIn 0.35s ease-out forwards;
  opacity: 0;
}

/* List items stagger inside the list */
.slide-content ul li:nth-child(1),
.slide-content ol li:nth-child(1) { animation-delay: 0.35s; }
.slide-content ul li:nth-child(2),
.slide-content ol li:nth-child(2) { animation-delay: 0.45s; }
.slide-content ul li:nth-child(3),
.slide-content ol li:nth-child(3) { animation-delay: 0.55s; }
.slide-content ul li:nth-child(4),
.slide-content ol li:nth-child(4) { animation-delay: 0.65s; }
.slide-content ul li:nth-child(5),
.slide-content ol li:nth-child(5) { animation-delay: 0.75s; }
.slide-content ul li:nth-child(n+6),
.slide-content ol li:nth-child(n+6) { animation-delay: 0.85s; }

@keyframes listItemFadeIn {
  0% {
    opacity: 0;
    transform: translateX(-8px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Headings */
.slide-content h1 {
  font-size: 3em;
  margin-bottom: 0.5em;
  font-weight: 700;
  background: linear-gradient(135deg, var(--af-primary), var(--af-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.slide-content h2 {
  font-size: 2em;
  margin-bottom: 0.5em;
  margin-top: 1em;
  color: var(--af-foreground);
}

.slide-content h3 {
  font-size: 1.5em;
  margin-bottom: 0.5em;
  color: var(--af-foreground);
}

.slide-content p {
  margin-bottom: 1em;
}

.slide-content ul, .slide-content ol {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.slide-content li {
  margin-bottom: 0.3em;
}

.slide-content code {
  font-family: var(--af-font-mono);
  background: var(--af-accent);
  padding: 0.1em 0.3em;
  border-radius: var(--af-border-radius-sm);
  font-size: 0.9em;
}

.slide-content pre {
  background: var(--af-accent);
  padding: 1em;
  border-radius: var(--af-border-radius-md);
  overflow-x: auto;
  margin: 1em 0;
}

.slide-content pre code {
  background: transparent;
  padding: 0;
  font-size: 0.85em;
  line-height: 1.5;
}

.slide-content blockquote {
  border-left: 4px solid var(--af-primary);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--af-muted);
}

.slide-content strong {
  font-weight: 600;
  color: var(--af-primary);
}

/* Canvas-based visualization containers */
.slide-content canvas {
  max-width: 100%;
  height: auto;
}

/* HTML segment container */
.html-segment {
  width: 100%;
}

/* Component error display */
.component-error {
  padding: 20px;
  background: var(--af-accent);
  border: 2px dashed var(--af-error);
  border-radius: var(--af-border-radius-md);
  color: var(--af-error);
  font-family: var(--af-font-mono);
}

/* Visualization component wrapper */
.slide-content > div[class*="Viz"] {
  width: 100%;
  height: 300px;
  margin: 1em 0;
}

/* Shiki code block styles */
.shiki {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
  padding: 1.5em !important;
  border-radius: 12px !important;
  overflow-x: auto;
  margin: 1.5em 0;
  font-family: var(--af-font-mono, 'JetBrains Mono', 'Fira Code', monospace) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.shiki::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px 12px 0 0;
}

/* macOS style traffic lights */
.shiki::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 16px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff5f57; /* Red - close */
  box-shadow: 
    20px 0 0 #ffbd2e, /* Yellow - minimize */
    40px 0 0 #28ca42; /* Green - maximize */
}

.shiki code {
  display: block;
  background: transparent !important;
  padding: 0 !important;
  padding-top: 24px !important;
  font-size: 0.85em !important;
  line-height: 1.7 !important;
  color: #e4e4e7;
}

/* Typewriter animation for code */
.shiki.typewriter {
  /* Container fades in quickly */
}

/* Target Shiki's line structure - .line is direct child of code */
/* Initial state: all lines hidden */
.shiki.typewriter code .line {
  opacity: 0;
  transform: translateY(8px);
  animation: fadeInLine 0.5s ease-out forwards;
}

/* Stagger each line - 80ms interval for slower effect */
.shiki.typewriter code .line:nth-child(1) { animation-delay: 0.1s; }
.shiki.typewriter code .line:nth-child(2) { animation-delay: 0.18s; }
.shiki.typewriter code .line:nth-child(3) { animation-delay: 0.26s; }
.shiki.typewriter code .line:nth-child(4) { animation-delay: 0.34s; }
.shiki.typewriter code .line:nth-child(5) { animation-delay: 0.42s; }
.shiki.typewriter code .line:nth-child(6) { animation-delay: 0.5s; }
.shiki.typewriter code .line:nth-child(7) { animation-delay: 0.58s; }
.shiki.typewriter code .line:nth-child(8) { animation-delay: 0.66s; }
.shiki.typewriter code .line:nth-child(9) { animation-delay: 0.74s; }
.shiki.typewriter code .line:nth-child(10) { animation-delay: 0.82s; }
.shiki.typewriter code .line:nth-child(n+11) { animation-delay: 0.9s; }

@keyframes fadeInLine {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.shiki.fallback {
  background: linear-gradient(135deg, #2d2d3a 0%, #1f1f2e 100%) !important;
}
</style>
