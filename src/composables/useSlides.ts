import { ref, computed, onMounted, watch, provide, type Ref } from 'vue'

/**
 * useSlides Composable
 * 
 * 幻灯片加载和解析管理，包括：
 * - Markdown 解析
 * - Frontmatter 提取
 * - 标题和备注提取
 */

export interface SlideInfo {
  content: string
  frontmatter: Record<string, unknown>
  title: string
  sectionTitle?: string
  notes?: string
}

export function useSlides() {
  const slides = ref<SlideInfo[]>([])
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  // Provide click state to children
  const clickIndex = ref(0)
  const totalClicks = ref(0)
  provide('clickIndex', clickIndex)
  provide('totalClicks', totalClicks)

  // Computed
  const totalSlides = computed(() => slides.value.length)
  const globalTitle = computed(() => {
    if (slides.value.length > 0 && slides.value[0].frontmatter.title) {
      return String(slides.value[0].frontmatter.title)
    }
    return 'AlgoFlow Presentation'
  })

  /**
   * Extract title and notes from slide content
   */
  function extractSlideTitle(content: string): { 
    title: string
    sectionTitle?: string
    notes?: string
    content: string 
  } {
    let title = 'Untitled'
    let sectionTitle: string | undefined
    let notes: string | undefined

    // Check for HTML comment title: <!-- title: xxx -->
    const commentMatch = content.match(/<!--\s*title:\s*(.+?)\s*-->/)
    if (commentMatch) {
      title = commentMatch[1].trim()
      content = content.replace(commentMatch[0], '').trim()
    }

    // Check for section title: <!-- section: xxx -->
    const sectionMatch = content.match(/<!--\s*section:\s*(.+?)\s*-->/)
    if (sectionMatch) {
      sectionTitle = sectionMatch[1].trim()
      content = content.replace(sectionMatch[0], '').trim()
    }

    // Check for speaker notes: <!-- notes: xxx -->
    const notesMatch = content.match(/<!--\s*notes:\s*([\s\S]*?)\s*-->/)
    if (notesMatch) {
      notes = notesMatch[1].trim()
      content = content.replace(notesMatch[0], '').trim()
    }

    // If no comment title, extract from first heading
    if (title === 'Untitled') {
      const lines = content.split('\n')
      for (const line of lines) {
        const match = line.match(/^(#{1,2})\s+(.+)$/)
        if (match) {
          title = match[2].trim()
          break
        }
      }
    }

    return { title, sectionTitle, notes, content }
  }

  /**
   * Load slides from markdown file
   */
  async function loadSlides(filePath?: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      // Check URL parameter for file path
      const urlParams = new URLSearchParams(window.location.search)
      const fileParam = urlParams.get('file')
      
      // Default to sorting.md if no file specified
      const path = filePath || fileParam || '/slides/examples/sorting.md'
      
      console.log('Loading slides from:', path)
      
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`Failed to load slides: ${response.statusText}`)
      }
      
      const markdown = await response.text()
      
      // Parse slides
      const lines = markdown.split('\n')
      const parsedSlides: SlideInfo[] = []
      
      let currentSlide = ''
      let globalFrontmatter: Record<string, unknown> = {}
      let inFrontmatter = false
      let frontmatterLines: string[] = []
      let isFirstSlide = true
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmedLine = line.trim()
        
        // Check for frontmatter at the start
        if (isFirstSlide && !inFrontmatter && trimmedLine === '---' && currentSlide.trim() === '') {
          inFrontmatter = true
          continue
        }
        
        if (inFrontmatter) {
          if (trimmedLine === '---') {
            inFrontmatter = false
            // Parse frontmatter
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
        
        // Check for slide separator
        if (trimmedLine === '---' && !inFrontmatter) {
          if (currentSlide.trim()) {
            const { title, sectionTitle, notes, content } = extractSlideTitle(currentSlide.trim())
            parsedSlides.push({
              content,
              frontmatter: { ...globalFrontmatter },
              title,
              sectionTitle,
              notes,
            })
            currentSlide = ''
          }
          isFirstSlide = false
          continue
        }
        
        currentSlide += line + '\n'
      }
      
      // Don't forget the last slide
      if (currentSlide.trim()) {
        const { title, sectionTitle, notes, content } = extractSlideTitle(currentSlide.trim())
        parsedSlides.push({
          content,
          frontmatter: { ...globalFrontmatter },
          title,
          sectionTitle,
          notes,
        })
      }
      
      slides.value = parsedSlides
      
      // Update document title
      document.title = globalTitle.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error loading slides:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get slide at specific index
   */
  function getSlide(index: number): SlideInfo | undefined {
    return slides.value[index]
  }

  /**
   * Get slide title for thumbnail
   */
  function getSlideTitle(slide: SlideInfo): string {
    return slide.title
  }

  /**
   * Get section title for grouping
   */
  function getSectionTitle(slide: SlideInfo): string | undefined {
    return slide.sectionTitle
  }

  // Load slides on mount
  onMounted(() => {
    loadSlides()
  })

  return {
    slides,
    isLoading,
    error,
    totalSlides,
    globalTitle,
    clickIndex,
    totalClicks,
    loadSlides,
    getSlide,
    getSlideTitle,
    getSectionTitle,
    extractSlideTitle,
  }
}
