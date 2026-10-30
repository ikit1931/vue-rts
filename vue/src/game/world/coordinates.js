import { ISO_TILE_HALF_HEIGHT, ISO_TILE_HALF_WIDTH } from './worldUnits.js'

function relativeWorldPoint(wx, wy, camera) {
  return {
    relWx: wx - camera.cameraCenterWx,
    relWy: wy - camera.cameraCenterWy,
  }
}

export function worldToScreen(wx, wy, camera, viewportSize) {
  const { width, height } = viewportSize
  const halfW = width / 2
  const halfH = height / 2
  const { relWx, relWy } = relativeWorldPoint(wx, wy, camera)
  return {
    sx: halfW + (relWx - relWy) * ISO_TILE_HALF_WIDTH,
    sy: halfH + (relWx + relWy) * ISO_TILE_HALF_HEIGHT,
  }
}

export function screenToWorld(sx, sy, camera, viewportSize) {
  const { width, height } = viewportSize
  const halfW = width / 2
  const halfH = height / 2
  const relA = (sx - halfW) / ISO_TILE_HALF_WIDTH
  const relB = (sy - halfH) / ISO_TILE_HALF_HEIGHT
  return {
    wx: (relA + relB) / 2 + camera.cameraCenterWx,
    wy: (relB - relA) / 2 + camera.cameraCenterWy,
  }
}

export function screenDragToCameraWorldDelta(deltaSx, deltaSy) {
  const hw = ISO_TILE_HALF_WIDTH
  const hh = ISO_TILE_HALF_HEIGHT
  return {
    deltaWx: -(deltaSx / hw + deltaSy / hh) / 2,
    deltaWy: (deltaSx / hw - deltaSy / hh) / 2,
  }
}

export function worldAxisCameraStepDelta(axis) {
  const step = ISO_TILE_HALF_WIDTH * 2
  if (axis === 'north') {
    return { deltaWx: 0, deltaWy: -step }
  }
  if (axis === 'south') {
    return { deltaWx: 0, deltaWy: step }
  }
  if (axis === 'west') {
    return { deltaWx: -step, deltaWy: 0 }
  }
  return { deltaWx: step, deltaWy: 0 }
}
