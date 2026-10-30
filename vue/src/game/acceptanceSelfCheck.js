import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { translateCameraWorldCenter } from './camera/cameraModel.js'
import { runCoordinatesSelfCheck } from './world/coordinatesSelfCheck.js'
import { screenToWorld, worldToScreen } from './world/coordinates.js'
import { WORLD_LAYER_HALF_SIZE } from './world/worldLayer.js'

const require = createRequire(import.meta.url)
const packageJson = require('../../package.json')

function near(a, b) {
  return Math.abs(a - b) < 1e-9
}

function domProjectWorldPoint(wx, wy, camera, viewportSize) {
  const { width, height } = viewportSize
  const halfW = width / 2
  const halfH = height / 2
  const layerTx = halfW - WORLD_LAYER_HALF_SIZE - camera.cameraCenterWx
  const layerTy = halfH - WORLD_LAYER_HALF_SIZE - camera.cameraCenterWy
  return {
    sx: layerTx + WORLD_LAYER_HALF_SIZE + wx,
    sy: layerTy + WORLD_LAYER_HALF_SIZE + wy,
  }
}

function collectSourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      collectSourceFiles(fullPath, acc)
      continue
    }
    if (/\.(vue|js|ts)$/.test(entry)) {
      acc.push(fullPath)
    }
  }
  return acc
}

export function runAcceptanceSelfCheck() {
  const errors = []
  const coordinatesResult = runCoordinatesSelfCheck()
  if (!coordinatesResult.ok) {
    errors.push(...coordinatesResult.errors.map((item) => `coordinates: ${item}`))
  }

  const viewportSize = { width: 800, height: 600 }
  const stubWx = 80
  const stubWy = 40
  let camera = translateCameraWorldCenter(
    { cameraCenterWx: 0, cameraCenterWy: 0 },
    120,
    -60,
  )

  const screenAfterPan = worldToScreen(stubWx, stubWy, camera, viewportSize)
  const domAfterPan = domProjectWorldPoint(stubWx, stubWy, camera, viewportSize)
  if (
    !near(screenAfterPan.sx, domAfterPan.sx) ||
    !near(screenAfterPan.sy, domAfterPan.sy)
  ) {
    errors.push('DOM projection diverged from worldToScreen after camera pan')
  }

  const worldFromClick = screenToWorld(screenAfterPan.sx, screenAfterPan.sy, camera, viewportSize)
  if (!near(worldFromClick.wx, stubWx) || !near(worldFromClick.wy, stubWy)) {
    errors.push('world position changed after camera pan')
  }

  const allowedDependencies = new Set(['vue', 'vue-router', 'vuex'])
  for (const dependency of Object.keys(packageJson.dependencies)) {
    if (!allowedDependencies.has(dependency)) {
      errors.push(`unexpected runtime dependency: ${dependency}`)
    }
  }

  const gameRoot = dirname(fileURLToPath(import.meta.url))
  const srcRoot = join(gameRoot, '..')
  const canvasTag = `<${'canvas'}`
  const canvasCreate = `createelement(${JSON.stringify('canvas')}`
  for (const filePath of collectSourceFiles(srcRoot)) {
    if (filePath.endsWith('SelfCheck.js')) {
      continue
    }
    const source = readFileSync(filePath, 'utf8').toLowerCase()
    if (source.includes(canvasTag) || source.includes(canvasCreate)) {
      errors.push(`canvas usage found: ${filePath}`)
    }
  }

  return { ok: errors.length === 0, errors }
}

const result = runAcceptanceSelfCheck()
if (!result.ok) {
  console.error('acceptance self-check failed:', result.errors)
  process.exit(1)
}
console.log('acceptance self-check OK')
