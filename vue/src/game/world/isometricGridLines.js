import { screenToWorld, worldToScreen } from './coordinates.js'
import { ISO_TILE_HALF_WIDTH } from './worldUnits.js'

const ISO_TILE_WORLD_SIZE = ISO_TILE_HALF_WIDTH * 2

export function buildIsometricGridLines(camera, viewportSize) {
  const { width, height } = viewportSize
  if (!width || !height) {
    return []
  }
  const corners = [
    screenToWorld(0, 0, camera, viewportSize),
    screenToWorld(width, 0, camera, viewportSize),
    screenToWorld(0, height, camera, viewportSize),
    screenToWorld(width, height, camera, viewportSize),
  ]
  const minWx = Math.min(...corners.map((point) => point.wx)) - ISO_TILE_WORLD_SIZE * 2
  const maxWx = Math.max(...corners.map((point) => point.wx)) + ISO_TILE_WORLD_SIZE * 2
  const minWy = Math.min(...corners.map((point) => point.wy)) - ISO_TILE_WORLD_SIZE * 2
  const maxWy = Math.max(...corners.map((point) => point.wy)) + ISO_TILE_WORLD_SIZE * 2
  const minSum = minWx + minWy
  const maxSum = maxWx + maxWy
  const minDiff = minWx - maxWy
  const maxDiff = maxWx - minWy
  const lines = []

  for (
    let sum = Math.floor(minSum / ISO_TILE_WORLD_SIZE) * ISO_TILE_WORLD_SIZE;
    sum <= maxSum;
    sum += ISO_TILE_WORLD_SIZE
  ) {
    const startWy = Math.max(minWy, sum - maxWx)
    const endWy = Math.min(maxWy, sum - minWx)
    if (startWy > endWy) {
      continue
    }
    const start = worldToScreen(sum - startWy, startWy, camera, viewportSize)
    const end = worldToScreen(sum - endWy, endWy, camera, viewportSize)
    lines.push({ x1: start.sx, y1: start.sy, x2: end.sx, y2: end.sy })
  }

  for (
    let diff = Math.floor(minDiff / ISO_TILE_WORLD_SIZE) * ISO_TILE_WORLD_SIZE;
    diff <= maxDiff;
    diff += ISO_TILE_WORLD_SIZE
  ) {
    const startWy = Math.max(minWy, diff + minWx)
    const endWy = Math.min(maxWy, diff + maxWx)
    if (startWy > endWy) {
      continue
    }
    const start = worldToScreen(diff + startWy, startWy, camera, viewportSize)
    const end = worldToScreen(diff + endWy, endWy, camera, viewportSize)
    lines.push({ x1: start.sx, y1: start.sy, x2: end.sx, y2: end.sy })
  }

  return lines
}
