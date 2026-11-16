import { isWorldPointInsideMap, MAP_LOGICAL_BOUNDS } from './bounds.js'
import { buildingHalfExtent, WORLD_GRID_SIZE } from './worldUnits.js'

const GRID_MIN = Math.floor(MAP_LOGICAL_BOUNDS.minWx / WORLD_GRID_SIZE)
const GRID_MAX = Math.ceil(MAP_LOGICAL_BOUNDS.maxWx / WORLD_GRID_SIZE)
const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

function worldToGrid(wx, wy) {
  return {
    gx: Math.round(wx / WORLD_GRID_SIZE),
    gy: Math.round(wy / WORLD_GRID_SIZE),
  }
}

function gridToWorld(gx, gy) {
  return {
    wx: gx * WORLD_GRID_SIZE,
    wy: gy * WORLD_GRID_SIZE,
  }
}

function cellKey(gx, gy) {
  return `${gx},${gy}`
}

export function circleHitsBuilding(wx, wy, radius, building) {
  const half = buildingHalfExtent(building.sizeN ?? 1)
  const closestX = Math.max(building.wx - half, Math.min(wx, building.wx + half))
  const closestY = Math.max(building.wy - half, Math.min(wy, building.wy + half))
  const dx = wx - closestX
  const dy = wy - closestY
  return dx * dx + dy * dy < radius * radius
}

export function pointBlockedByBuildings(wx, wy, radius, buildings) {
  if (!isWorldPointInsideMap(wx, wy)) return true
  return buildings.some((building) => circleHitsBuilding(wx, wy, radius, building))
}

export function segmentBlockedByBuildings(ax, ay, bx, by, radius, buildings) {
  const dx = bx - ax
  const dy = by - ay
  const length = Math.hypot(dx, dy)
  if (length === 0) return pointBlockedByBuildings(ax, ay, radius, buildings)
  const steps = Math.max(1, Math.ceil(length / (WORLD_GRID_SIZE / 2)))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    if (pointBlockedByBuildings(ax + dx * t, ay + dy * t, radius, buildings)) return true
  }
  return false
}

function isCellBlocked(gx, gy, radius, buildings, allowKey = null) {
  if (gx < GRID_MIN || gx > GRID_MAX || gy < GRID_MIN || gy > GRID_MAX) return true
  if (allowKey !== null && cellKey(gx, gy) === allowKey) return false
  const { wx, wy } = gridToWorld(gx, gy)
  return pointBlockedByBuildings(wx, wy, radius, buildings)
}

function refineTowardGoal(fromWx, fromWy, goalWx, goalWy, radius, buildings) {
  if (!pointBlockedByBuildings(goalWx, goalWy, radius, buildings)) {
    return { wx: goalWx, wy: goalWy }
  }
  let lo = 0
  let hi = 1
  let best = { wx: fromWx, wy: fromWy }
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    const wx = fromWx + (goalWx - fromWx) * mid
    const wy = fromWy + (goalWy - fromWy) * mid
    if (pointBlockedByBuildings(wx, wy, radius, buildings)) {
      hi = mid
    } else {
      best = { wx, wy }
      lo = mid
    }
  }
  return best
}

export function findNearestFreePoint(wx, wy, radius, buildings, maxRadius = 80) {
  if (!pointBlockedByBuildings(wx, wy, radius, buildings)) {
    return { wx, wy }
  }
  const start = worldToGrid(wx, wy)
  let best = null
  let bestDist = Infinity
  for (let ring = 1; ring <= maxRadius; ring++) {
    if (ring * WORLD_GRID_SIZE >= bestDist) break
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue
        const gx = start.gx + dx
        const gy = start.gy + dy
        if (isCellBlocked(gx, gy, radius, buildings)) continue
        const cell = gridToWorld(gx, gy)
        const point = refineTowardGoal(cell.wx, cell.wy, wx, wy, radius, buildings)
        const dist = Math.hypot(point.wx - wx, point.wy - wy)
        if (dist < bestDist) {
          bestDist = dist
          best = point
        }
      }
    }
  }
  return best
}

function heuristic(ax, ay, bx, by) {
  const dx = Math.abs(ax - bx)
  const dy = Math.abs(ay - by)
  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)
}

function reconstructPath(cameFrom, endKey) {
  const path = []
  let key = endKey
  while (key) {
    const [gx, gy] = key.split(',').map(Number)
    path.push(gridToWorld(gx, gy))
    key = cameFrom.get(key)
  }
  path.reverse()
  return path
}

function simplifyPath(path, radius, buildings) {
  if (path.length <= 2) return path
  const result = [path[0]]
  let anchor = 0
  while (anchor < path.length - 1) {
    let farthest = anchor + 1
    for (let i = path.length - 1; i > anchor + 1; i--) {
      if (
        !segmentBlockedByBuildings(
          path[anchor].wx,
          path[anchor].wy,
          path[i].wx,
          path[i].wy,
          radius,
          buildings,
        )
      ) {
        farthest = i
        break
      }
    }
    result.push(path[farthest])
    anchor = farthest
  }
  return result
}

function buildingsSignature(buildings) {
  return buildings
    .filter((item) => item.type === 'building' && (item.stats?.hp ?? 1) > 0)
    .map((item) => `${item.id}:${item.wx}:${item.wy}:${item.sizeN}`)
    .join('|')
}

function findNearestFreeCell(wx, wy, radius, buildings, maxRadius = 80) {
  const start = worldToGrid(wx, wy)
  if (!isCellBlocked(start.gx, start.gy, radius, buildings)) return start
  let best = null
  let bestDist = Infinity
  for (let ring = 1; ring <= maxRadius; ring++) {
    if (ring * WORLD_GRID_SIZE >= bestDist) break
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue
        const gx = start.gx + dx
        const gy = start.gy + dy
        if (isCellBlocked(gx, gy, radius, buildings)) continue
        const point = gridToWorld(gx, gy)
        const dist = Math.hypot(point.wx - wx, point.wy - wy)
        if (dist < bestDist) {
          bestDist = dist
          best = { gx, gy }
        }
      }
    }
  }
  return best
}

export function findPathAroundBuildings(startWx, startWy, goalWx, goalWy, buildings, radius = 16) {
  const aliveBuildings = buildings.filter(
    (item) => item.type === 'building' && (item.stats?.hp ?? 1) > 0,
  )

  const goalCell = findNearestFreeCell(goalWx, goalWy, radius, aliveBuildings)
  if (!goalCell) return []
  const goalCellWorld = gridToWorld(goalCell.gx, goalCell.gy)
  const goalPoint = refineTowardGoal(
    goalCellWorld.wx,
    goalCellWorld.wy,
    goalWx,
    goalWy,
    radius,
    aliveBuildings,
  )

  const start = worldToGrid(startWx, startWy)
  const startKey = cellKey(start.gx, start.gy)
  const goalKey = cellKey(goalCell.gx, goalCell.gy)

  if (Math.hypot(goalPoint.wx - startWx, goalPoint.wy - startWy) < 0.0001) return []

  if (
    !segmentBlockedByBuildings(
      startWx,
      startWy,
      goalPoint.wx,
      goalPoint.wy,
      radius,
      aliveBuildings,
    )
  ) {
    return [{ wx: goalPoint.wx, wy: goalPoint.wy }]
  }

  const open = [
    { gx: start.gx, gy: start.gy, f: heuristic(start.gx, start.gy, goalCell.gx, goalCell.gy) },
  ]
  const cameFrom = new Map()
  const gScore = new Map([[startKey, 0]])
  const closed = new Set()

  while (open.length > 0) {
    let best = 0
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[best].f) best = i
    }
    const current = open[best]
    open[best] = open[open.length - 1]
    open.pop()

    const currentKey = cellKey(current.gx, current.gy)
    if (closed.has(currentKey)) continue
    closed.add(currentKey)

    if (currentKey === goalKey) {
      const raw = reconstructPath(cameFrom, goalKey)
      if (raw.length > 0) raw[raw.length - 1] = { wx: goalPoint.wx, wy: goalPoint.wy }
      else raw.push({ wx: goalPoint.wx, wy: goalPoint.wy })
      const withStart = [{ wx: startWx, wy: startWy }, ...raw]
      return simplifyPath(withStart, radius, aliveBuildings).slice(1)
    }

    for (const [dx, dy] of NEIGHBORS) {
      const nx = current.gx + dx
      const ny = current.gy + dy
      const neighborKey = cellKey(nx, ny)
      if (closed.has(neighborKey)) continue
      if (isCellBlocked(nx, ny, radius, aliveBuildings, startKey)) continue
      if (
        dx !== 0 &&
        dy !== 0 &&
        (isCellBlocked(current.gx + dx, current.gy, radius, aliveBuildings, startKey) ||
          isCellBlocked(current.gx, current.gy + dy, radius, aliveBuildings, startKey))
      ) {
        continue
      }

      const stepCost = dx !== 0 && dy !== 0 ? Math.SQRT2 : 1
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + stepCost
      if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) continue

      cameFrom.set(neighborKey, currentKey)
      gScore.set(neighborKey, tentativeG)
      open.push({
        gx: nx,
        gy: ny,
        f: tentativeG + heuristic(nx, ny, goalCell.gx, goalCell.gy),
      })
    }
  }

  return []
}

export function ensureMovePath(event, unit, buildings) {
  const radius = unit.radius ?? 16
  const sig = buildingsSignature(buildings)
  const stale =
    !Array.isArray(event.path) ||
    event._pathBuildingsSig !== sig ||
    event._pathFromWx !== event.wx ||
    event._pathFromWy !== event.wy

  if (!stale) return event.path

  event.path = findPathAroundBuildings(unit.wx, unit.wy, event.wx, event.wy, buildings, radius)
  event._pathBuildingsSig = sig
  event._pathFromWx = event.wx
  event._pathFromWy = event.wy
  return event.path
}
