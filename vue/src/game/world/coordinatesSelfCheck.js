import { createCameraAtWorldCenter } from '../camera/cameraModel.js'
import { WORLD_ORIGIN } from './conventions.js'
import { screenToWorld, worldToScreen } from './coordinates.js'

function near(a, b) {
  return Math.abs(a - b) < 1e-9
}

export function runCoordinatesSelfCheck() {
  const errors = []
  const camera = createCameraAtWorldCenter(WORLD_ORIGIN.wx, WORLD_ORIGIN.wy)
  const worldCenterWx = WORLD_ORIGIN.wx
  const worldCenterWy = WORLD_ORIGIN.wy

  for (const viewportSize of [
    { width: 800, height: 600 },
    { width: 1024, height: 768 },
  ]) {
    const { sx, sy } = worldToScreen(worldCenterWx, worldCenterWy, camera, viewportSize)
    if (
      !near(sx, viewportSize.width / 2) ||
      !near(sy, viewportSize.height / 2)
    ) {
      errors.push(
        `world center not at screen center for ${viewportSize.width}x${viewportSize.height}`,
      )
    }
    const roundTrip = screenToWorld(sx, sy, camera, viewportSize)
    if (!near(roundTrip.wx, worldCenterWx) || !near(roundTrip.wy, worldCenterWy)) {
      errors.push(`round-trip failed for ${viewportSize.width}x${viewportSize.height}`)
    }
  }

  const fixedWx = 100
  const fixedWy = 50
  const viewportBeforeResize = { width: 800, height: 600 }
  const viewportAfterResize = { width: 640, height: 480 }
  const screenBefore = worldToScreen(fixedWx, fixedWy, camera, viewportBeforeResize)
  const screenAfter = worldToScreen(fixedWx, fixedWy, camera, viewportAfterResize)
  if (near(screenBefore.sx, screenAfter.sx) && near(screenBefore.sy, screenAfter.sy)) {
    errors.push('viewport resize did not change screen projection')
  }
  const worldAfterBefore = screenToWorld(
    screenBefore.sx,
    screenBefore.sy,
    camera,
    viewportBeforeResize,
  )
  const worldAfterResize = screenToWorld(
    screenAfter.sx,
    screenAfter.sy,
    camera,
    viewportAfterResize,
  )
  if (
    !near(worldAfterBefore.wx, fixedWx) ||
    !near(worldAfterBefore.wy, fixedWy) ||
    !near(worldAfterResize.wx, fixedWx) ||
    !near(worldAfterResize.wy, fixedWy)
  ) {
    errors.push('world coordinates changed when viewport size changed')
  }

  return { ok: errors.length === 0, errors }
}

const isDirectRun = process.argv[1]?.endsWith('coordinatesSelfCheck.js')

if (isDirectRun) {
  const result = runCoordinatesSelfCheck()
  if (!result.ok) {
    console.error('coordinates self-check failed:', result.errors)
    process.exit(1)
  }
  console.log('coordinates self-check OK')
}
