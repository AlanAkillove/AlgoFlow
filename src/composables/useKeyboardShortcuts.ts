import { onMounted, onUnmounted, type Ref } from 'vue'

/**
 * useKeyboardShortcuts Composable
 * 
 * 键盘快捷键管理
 */

export interface KeyboardShortcutsOptions {
  /** Handler for next action */
  onNext?: () => void
  /** Handler for prev action */
  onPrev?: () => void
  /** Handler for first slide */
  onFirst?: () => void
  /** Handler for last slide */
  onLast?: () => void
  /** Handler for fullscreen toggle */
  onToggleFullscreen?: () => void
  /** Handler for theme toggle */
  onToggleTheme?: () => void
  /** Handler for speaker notes toggle */
  onToggleSpeakerNotes?: () => void
  /** Handler for drawing mode toggle */
  onToggleDrawing?: () => void
  /** Handler for laser pointer toggle */
  onToggleLaserPointer?: () => void
  /** Handler for presenter mode */
  onOpenPresenter?: () => void
  /** Handler for thumbnail nav toggle */
  onToggleThumbnailNav?: () => void
  /** Handler for keyboard hints toggle */
  onToggleKeyboardHints?: () => void
  /** Handler for undo (Ctrl+Z) */
  onUndo?: () => void
  /** Handler for redo (Ctrl+Y, Ctrl+Shift+Z) */
  onRedo?: () => void
  /** Handler for escape */
  onEscape?: () => void
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  /**
   * Handle keydown events
   */
  function handleKeydown(e: KeyboardEvent): void {
    // Ignore if typing in input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    // Undo: Ctrl+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      options.onUndo?.()
      return
    }

    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      options.onRedo?.()
      return
    }

    // Show keyboard hints on ?
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault()
      options.onToggleKeyboardHints?.()
      return
    }

    // Escape
    if (e.key === 'Escape') {
      options.onEscape?.()
      return
    }

    // Toggle thumbnail nav on G
    if (e.key === 'g' || e.key === 'G') {
      options.onToggleThumbnailNav?.()
      return
    }

    // Fullscreen on F
    if (e.key === 'f' || e.key === 'F') {
      options.onToggleFullscreen?.()
      return
    }

    // Toggle speaker notes on S
    if (e.key === 's' || e.key === 'S') {
      options.onToggleSpeakerNotes?.()
      return
    }

    // Toggle drawing mode on D
    if (e.key === 'd' || e.key === 'D') {
      options.onToggleDrawing?.()
      return
    }

    // Toggle laser pointer on L
    if (e.key === 'l' || e.key === 'L') {
      options.onToggleLaserPointer?.()
      return
    }

    // Open presenter window on P
    if (e.key === 'p' || e.key === 'P') {
      options.onOpenPresenter?.()
      return
    }

    // Navigation keys
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault()
        options.onNext?.()
        break
      case 'ArrowLeft':
        options.onPrev?.()
        break
      case 'Home':
        options.onFirst?.()
        break
      case 'End':
        options.onLast?.()
        break
    }
  }

  // Setup event listener
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    handleKeydown,
  }
}
