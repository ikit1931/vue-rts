import { WORLD_UNITS_PER_CSS_PIXEL } from './worldUnits.js'

export function worldToScreen(wx, wy, camera, viewportSize) {
  const { width, height } = viewportSize
  const halfW = width / 2
  const halfH = height / 2
  return {
    sx: (wx - camera.cameraCenterWx) * WORLD_UNITS_PER_CSS_PIXEL + halfW,
    sy: (wy - camera.cameraCenterWy) * WORLD_UNITS_PER_CSS_PIXEL + halfH,
  }
}

export function screenToWorld(sx, sy, camera, viewportSize) {
  const { width, height } = viewportSize
  const halfW = width / 2
  const halfH = height / 2
  return {
    wx: (sx - halfW) / WORLD_UNITS_PER_CSS_PIXEL + camera.cameraCenterWx,
    wy: (sy - halfH) / WORLD_UNITS_PER_CSS_PIXEL + camera.cameraCenterWy,
  }
}
