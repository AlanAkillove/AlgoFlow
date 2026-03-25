import { ref, type Ref } from 'vue'

/**
 * useLaserPointer Composable
 * 
 * 激光笔功能状态管理
 */

export function useLaserPointer() {
  const isLaserPointer = ref(false)
  const laserX = ref(0)
  const laserY = ref(0)

  /**
   * Update laser pointer position
   */
  function updatePosition(e: MouseEvent): void {
    if (!isLaserPointer.value) return
    laserX.value = e.clientX
    laserY.value = e.clientY
  }

  /**
   * Toggle laser pointer on/off
   */
  function toggle(): void {
    isLaserPointer.value = !isLaserPointer.value
  }

  /**
   * Enable laser pointer
   */
  function enable(): void {
    isLaserPointer.value = true
  }

  /**
   * Disable laser pointer
   */
  function disable(): void {
    isLaserPointer.value = false
  }

  return {
    isLaserPointer,
    laserX,
    laserY,
    updatePosition,
    toggle,
    enable,
    disable,
  }
}
