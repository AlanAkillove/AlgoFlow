import { ref, onMounted, onUnmounted } from 'vue'

/**
 * usePresenterMode Composable
 * 
 * 演讲者模式功能管理，包括：
 * - 演讲者窗口打开
 * - BroadcastChannel 同步
 * - 计时器管理
 */

export interface PresenterSyncData {
  type: 'slide-change'
  data: {
    index: number
    clickIndex: number
  }
}

export function usePresenterMode() {
  const isPresenterMode = ref(false)
  const isPresenterWindow = ref(false)
  const presenterChannel = ref<BroadcastChannel | null>(null)
  const elapsedTime = ref(0)
  const timerInterval = ref<number | null>(null)

  /**
   * Check if this is a presenter window
   */
  function checkPresenterWindow(): void {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      isPresenterWindow.value = urlParams.get('presenter') === 'true'
    }
  }

  /**
   * Open presenter window
   */
  function openPresenterWindow(): void {
    const url = new URL(window.location.href)
    url.searchParams.set('presenter', 'true')
    window.open(url.toString(), 'algoflow-presenter', 'width=1280,height=720')
    isPresenterMode.value = true
  }

  /**
   * Initialize broadcast channel for sync
   */
  function initChannel(
    onMessage: (data: PresenterSyncData) => void
  ): void {
    if (typeof BroadcastChannel === 'undefined') return

    presenterChannel.value = new BroadcastChannel('algoflow-sync')

    presenterChannel.value.onmessage = (event) => {
      if (isPresenterWindow.value) {
        onMessage(event.data as PresenterSyncData)
      }
    }
  }

  /**
   * Broadcast slide change to presenter window
   */
  function broadcastSlideChange(index: number, clickIndex: number): void {
    if (!presenterChannel.value) return

    presenterChannel.value.postMessage({
      type: 'slide-change',
      data: { index, clickIndex }
    })
  }

  /**
   * Start timer
   */
  function startTimer(): void {
    if (timerInterval.value) return
    timerInterval.value = window.setInterval(() => {
      elapsedTime.value++
    }, 1000)
  }

  /**
   * Stop timer
   */
  function stopTimer(): void {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  /**
   * Reset timer
   */
  function resetTimer(): void {
    stopTimer()
    elapsedTime.value = 0
  }

  /**
   * Format time as MM:SS
   */
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize on mount
  onMounted(() => {
    checkPresenterWindow()
    
    if (isPresenterWindow.value) {
      startTimer()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopTimer()
    if (presenterChannel.value) {
      presenterChannel.value.close()
    }
  })

  return {
    isPresenterMode,
    isPresenterWindow,
    elapsedTime,
    openPresenterWindow,
    initChannel,
    broadcastSlideChange,
    startTimer,
    stopTimer,
    resetTimer,
    formatTime,
  }
}
