import { ref, computed, type Ref } from 'vue'

/**
 * useSlideNavigation Composable
 * 
 * 幻灯片导航功能管理，包括：
 * - 当前幻灯片索引
 * - 点击动画状态 (v-click)
 * - 导航方法
 */

export function useSlideNavigation(totalSlides: Ref<number>) {
  const currentIndex = ref(0)
  const clickIndex = ref(0)
  const totalClicks = ref(0)

  // Computed properties
  const isFirstSlide = computed(() => currentIndex.value === 0)
  const isLastSlide = computed(() => currentIndex.value >= totalSlides.value - 1)
  const hasMoreClicks = computed(() => clickIndex.value < totalClicks.value)
  const canGoBack = computed(() => clickIndex.value > 0 || currentIndex.value > 0)

  /**
   * Go to next slide or click animation
   */
  function goNext(): number {
    // Check if there are remaining click animations
    if (clickIndex.value < totalClicks.value) {
      clickIndex.value++
      return currentIndex.value
    }
    // Otherwise go to next slide
    if (currentIndex.value < totalSlides.value - 1) {
      currentIndex.value++
      return currentIndex.value
    }
    return currentIndex.value
  }

  /**
   * Go to previous slide or click animation
   */
  function goPrev(): number {
    // Check if we can go back in click animations
    if (clickIndex.value > 0) {
      clickIndex.value--
      return currentIndex.value
    }
    // Otherwise go to previous slide
    if (currentIndex.value > 0) {
      currentIndex.value--
      return currentIndex.value
    }
    return currentIndex.value
  }

  /**
   * Go to specific slide
   */
  function goTo(index: number): void {
    if (index >= 0 && index < totalSlides.value) {
      currentIndex.value = index
      clickIndex.value = 0
    }
  }

  /**
   * Go to first slide
   */
  function goFirst(): void {
    currentIndex.value = 0
    clickIndex.value = 0
  }

  /**
   * Go to last slide
   */
  function goLast(): void {
    currentIndex.value = totalSlides.value - 1
    clickIndex.value = 0
  }

  /**
   * Reset click index (call when slide changes)
   */
  function resetClickIndex(): void {
    clickIndex.value = 0
  }

  /**
   * Set total clicks for current slide
   */
  function setTotalClicks(count: number): void {
    totalClicks.value = count
  }

  return {
    currentIndex,
    clickIndex,
    totalClicks,
    isFirstSlide,
    isLastSlide,
    hasMoreClicks,
    canGoBack,
    goNext,
    goPrev,
    goTo,
    goFirst,
    goLast,
    resetClickIndex,
    setTotalClicks,
  }
}
