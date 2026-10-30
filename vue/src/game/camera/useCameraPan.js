import { onMounted, onUnmounted, unref } from 'vue'

const PAN_POINTER_BUTTONS = new Set([1, 2])

export function useCameraPan(viewportEl, onPanDelta) {
  let lastClientX = 0
  let lastClientY = 0
  let panning = false

  const applyPanDelta = (deltaSx, deltaSy) => {
    onPanDelta(-deltaSx, -deltaSy)
  }

  const onPointerDown = (event) => {
    if (!PAN_POINTER_BUTTONS.has(event.button)) {
      return
    }
    panning = true
    lastClientX = event.clientX
    lastClientY = event.clientY
    unref(viewportEl)?.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const onPointerMove = (event) => {
    if (!panning) {
      return
    }
    const deltaSx = event.clientX - lastClientX
    const deltaSy = event.clientY - lastClientY
    lastClientX = event.clientX
    lastClientY = event.clientY
    applyPanDelta(deltaSx, deltaSy)
  }

  const onPointerUp = (event) => {
    if (!panning) {
      return
    }
    panning = false
    unref(viewportEl)?.releasePointerCapture(event.pointerId)
  }

  const onContextMenu = (event) => {
    event.preventDefault()
  }

  const onKeyDown = (event) => {
    const step = 48
    if (event.code === 'KeyW') {
      applyPanDelta(0, -step)
    } else if (event.code === 'KeyS') {
      applyPanDelta(0, step)
    } else if (event.code === 'KeyA') {
      applyPanDelta(-step, 0)
    } else if (event.code === 'KeyD') {
      applyPanDelta(step, 0)
    } else {
      return
    }
    event.preventDefault()
  }

  onMounted(() => {
    const element = unref(viewportEl)
    if (!element) {
      return
    }
    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerUp)
    element.addEventListener('pointercancel', onPointerUp)
    element.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('keydown', onKeyDown)
  })

  onUnmounted(() => {
    const element = unref(viewportEl)
    element?.removeEventListener('pointerdown', onPointerDown)
    element?.removeEventListener('pointermove', onPointerMove)
    element?.removeEventListener('pointerup', onPointerUp)
    element?.removeEventListener('pointercancel', onPointerUp)
    element?.removeEventListener('contextmenu', onContextMenu)
    window.removeEventListener('keydown', onKeyDown)
  })
}
