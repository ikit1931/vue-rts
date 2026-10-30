import { nextTick, onMounted, onUnmounted, unref } from 'vue'
import {
  screenDragToCameraWorldDelta,
  worldAxisCameraStepDelta,
} from '../world/coordinates.js'

const PAN_POINTER_BUTTONS = new Set([0, 1, 2])

export function useCameraPan(viewportEl, onPanCamera) {
  let lastClientX = 0
  let lastClientY = 0
  let panning = false
  let mountedElement = null

  const dragMapByScreenDelta = (deltaSx, deltaSy) => {
    const { deltaWx, deltaWy } = screenDragToCameraWorldDelta(deltaSx, deltaSy)
    onPanCamera(deltaWx, deltaWy)
  }

  const onPointerDown = (event) => {
    if (!PAN_POINTER_BUTTONS.has(event.button)) {
      return
    }
    panning = true
    lastClientX = event.clientX
    lastClientY = event.clientY
    mountedElement?.setPointerCapture(event.pointerId)
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
    dragMapByScreenDelta(deltaSx, deltaSy)
  }

  const onPointerUp = (event) => {
    if (!panning) {
      return
    }
    panning = false
    mountedElement?.releasePointerCapture(event.pointerId)
  }

  const onContextMenu = (event) => {
    event.preventDefault()
  }

  const onWheel = (event) => {
    event.preventDefault()
  }

  const onKeyDown = (event) => {
    if (event.target !== mountedElement && !mountedElement?.contains(event.target)) {
      return
    }
    if (event.code === 'KeyW') {
      const { deltaWx, deltaWy } = worldAxisCameraStepDelta('north')
      onPanCamera(deltaWx, deltaWy)
    } else if (event.code === 'KeyS') {
      const { deltaWx, deltaWy } = worldAxisCameraStepDelta('south')
      onPanCamera(deltaWx, deltaWy)
    } else if (event.code === 'KeyA') {
      const { deltaWx, deltaWy } = worldAxisCameraStepDelta('west')
      onPanCamera(deltaWx, deltaWy)
    } else if (event.code === 'KeyD') {
      const { deltaWx, deltaWy } = worldAxisCameraStepDelta('east')
      onPanCamera(deltaWx, deltaWy)
    } else {
      return
    }
    event.preventDefault()
  }

  onMounted(async () => {
    await nextTick()
    mountedElement = unref(viewportEl)
    if (!mountedElement) {
      return
    }
    mountedElement.addEventListener('pointerdown', onPointerDown)
    mountedElement.addEventListener('pointermove', onPointerMove)
    mountedElement.addEventListener('pointerup', onPointerUp)
    mountedElement.addEventListener('pointercancel', onPointerUp)
    mountedElement.addEventListener('contextmenu', onContextMenu)
    mountedElement.addEventListener('wheel', onWheel, { passive: false })
    mountedElement.addEventListener('keydown', onKeyDown)
  })

  onUnmounted(() => {
    mountedElement?.removeEventListener('pointerdown', onPointerDown)
    mountedElement?.removeEventListener('pointermove', onPointerMove)
    mountedElement?.removeEventListener('pointerup', onPointerUp)
    mountedElement?.removeEventListener('pointercancel', onPointerUp)
    mountedElement?.removeEventListener('contextmenu', onContextMenu)
    mountedElement?.removeEventListener('wheel', onWheel)
    mountedElement?.removeEventListener('keydown', onKeyDown)
  })
}
