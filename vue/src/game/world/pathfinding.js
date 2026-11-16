import {isWorldPointInsideMap, MAP_LOGICAL_BOUNDS} from './bounds.js'
import {buildingHalfExtent, WORLD_GRID_SIZE} from './worldUnits.js'

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

export function pointBlockedByObjects(wx, wy, radius, objects, ignoredId = null) {
    if (!isWorldPointInsideMap(wx, wy)) return true

    return objects.some((object) => {
        if (object.id === ignoredId) return false
        if ((object.stats?.hp ?? 1) <= 0) return false

        if (object.type === 'building') {
            const half = buildingHalfExtent(object.sizeN ?? 1) + radius

            return (
                Math.abs(wx - object.wx) < half &&
                Math.abs(wy - object.wy) < half
            )
        }

        if (object.type === 'unit') {
            const minDistance = radius + (object.radius ?? 16)
            const dx = wx - object.wx
            const dy = wy - object.wy

            return dx * dx + dy * dy < minDistance * minDistance
        }

        return false
    })
}

export function segmentBlockedByObjects(
    ax, ay, bx, by, radius, objects, ignoredId = null
) {
    if (
        !isWorldPointInsideMap(ax, ay) ||
        !isWorldPointInsideMap(bx, by)
    ) {
        return true
    }

    return objects.some((object) => {
        if (object.id === ignoredId) return false
        if ((object.stats?.hp ?? 1) <= 0) return false

        if (object.type === 'building') {
            const half = buildingHalfExtent(object.sizeN ?? 1) + radius

            return segmentIntersectsAabb(
                ax, ay, bx, by,
                object.wx - half,
                object.wy - half,
                object.wx + half,
                object.wy + half
            )
        }

        if (object.type === 'unit') {
            const minDistance = radius + (object.radius ?? 16)

            return pointSegmentDistanceSquared(
                object.wx, object.wy,
                ax, ay, bx, by
            ) < minDistance * minDistance
        }

        return false
    })
}

function isCellBlocked(gx, gy, radius, buildings, allowKey = null) {
    if (gx < GRID_MIN || gx > GRID_MAX || gy < GRID_MIN || gy > GRID_MAX) return true
    if (allowKey !== null && cellKey(gx, gy) === allowKey) return false
    const {wx, wy} = gridToWorld(gx, gy)
    return pointBlockedByObjects(wx, wy, radius, buildings)
}

function refineTowardGoal(fromWx, fromWy, goalWx, goalWy, radius, buildings) {
    if (!pointBlockedByObjects(goalWx, goalWy, radius, buildings)) {
        return {wx: goalWx, wy: goalWy}
    }
    let lo = 0
    let hi = 1
    let best = {wx: fromWx, wy: fromWy}
    for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2
        const wx = fromWx + (goalWx - fromWx) * mid
        const wy = fromWy + (goalWy - fromWy) * mid
        if (pointBlockedByObjects(wx, wy, radius, buildings)) {
            hi = mid
        } else {
            best = {wx, wy}
            lo = mid
        }
    }
    return best
}

export function findNearestFreePoint(wx, wy, radius, buildings, maxRadius = 80) {
    if (!pointBlockedByObjects(wx, wy, radius, buildings)) {
        return {wx, wy}
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
                !segmentBlockedByObjects(
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

function objectsSignature(objects) {
    return objects
        .filter((item) => (item.stats?.hp ?? 1) > 0)
        .map((item) =>
            [
                item.id,
                item.type,
                Math.round(item.wx / WORLD_GRID_SIZE),
                Math.round(item.wy / WORLD_GRID_SIZE),
                item.sizeN ?? '',
                item.radius ?? '',
            ].join(':')
        )
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
                    best = {gx, gy}
                }
            }
        }
    }
    return best
}

export function findPathAroundObjects(
    startWx, startWy, goalWx, goalWy, objects, radius = 16, ignoredId = null
) {
    const aliveObjects = objects.filter(
        (item) =>
            item.id !== ignoredId &&
            (item.type === 'building' || item.type === 'unit') &&
            (item.stats?.hp ?? 1) > 0
    )

    const goalCell = findNearestFreeCell(goalWx, goalWy, radius, aliveObjects)
    if (!goalCell) return []
    const goalCellWorld = gridToWorld(goalCell.gx, goalCell.gy)
    const goalPoint = refineTowardGoal(
        goalCellWorld.wx,
        goalCellWorld.wy,
        goalWx,
        goalWy,
        radius,
        aliveObjects,
    )

    const start = worldToGrid(startWx, startWy)
    const startKey = cellKey(start.gx, start.gy)
    const goalKey = cellKey(goalCell.gx, goalCell.gy)

    if (Math.hypot(goalPoint.wx - startWx, goalPoint.wy - startWy) < 0.0001) return []

    if (
        !segmentBlockedByObjects(
            startWx,
            startWy,
            goalPoint.wx,
            goalPoint.wy,
            radius,
            aliveObjects,
        )
    ) {
        return [{wx: goalPoint.wx, wy: goalPoint.wy}]
    }

    const open = [
        {gx: start.gx, gy: start.gy, f: heuristic(start.gx, start.gy, goalCell.gx, goalCell.gy)},
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
            if (raw.length > 0) raw[raw.length - 1] = {wx: goalPoint.wx, wy: goalPoint.wy}
            else raw.push({wx: goalPoint.wx, wy: goalPoint.wy})
            const withStart = [{wx: startWx, wy: startWy}, ...raw]
            return simplifyPath(withStart, radius, aliveObjects).slice(1)
        }

        for (const [dx, dy] of NEIGHBORS) {
            const nx = current.gx + dx
            const ny = current.gy + dy
            const neighborKey = cellKey(nx, ny)
            if (closed.has(neighborKey)) continue
            if (isCellBlocked(nx, ny, radius, aliveObjects, startKey)) continue
            if (
                dx !== 0 &&
                dy !== 0 &&
                (isCellBlocked(current.gx + dx, current.gy, radius, aliveObjects, startKey) ||
                    isCellBlocked(current.gx, current.gy + dy, radius, aliveObjects, startKey))
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

export function ensureMovePath(event, unit, objects) {
    const radius = unit.radius ?? 16

    const obstacles = objects.filter(
        (item) =>
            item.id !== unit.id &&
            (item.type === 'building' || item.type === 'unit') &&
            (item.stats?.hp ?? 1) > 0
    )

    const sig = objectsSignature(obstacles)

    const stale =
        !Array.isArray(event.path) ||
        event._pathObjectsSig !== sig ||
        event._pathFromWx !== event.wx ||
        event._pathFromWy !== event.wy

    if (!stale) return event.path

    event.path = findPathAroundObjects(
        unit.wx,
        unit.wy,
        event.wx,
        event.wy,
        obstacles,
        radius
    )

    event._pathObjectsSig = sig
    event._pathFromWx = event.wx
    event._pathFromWy = event.wy

    return event.path
}

function pointSegmentDistanceSquared(px, py, ax, ay, bx, by) {
    const dx = bx - ax
    const dy = by - ay
    const lengthSquared = dx * dx + dy * dy

    if (lengthSquared === 0) {
        const ox = px - ax
        const oy = py - ay
        return ox * ox + oy * oy
    }

    const t = Math.max(
        0,
        Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)
    )

    const nearestX = ax + t * dx
    const nearestY = ay + t * dy

    const ox = px - nearestX
    const oy = py - nearestY

    return ox * ox + oy * oy
}

function segmentIntersectsAabb(ax, ay, bx, by, minX, minY, maxX, maxY) {
    const dx = bx - ax
    const dy = by - ay

    let tMin = 0
    let tMax = 1

    const p = [-dx, dx, -dy, dy]
    const q = [
        ax - minX,
        maxX - ax,
        ay - minY,
        maxY - ay,
    ]

    for (let i = 0; i < 4; i++) {
        if (p[i] === 0) {
            if (q[i] < 0) return false
            continue
        }

        const t = q[i] / p[i]

        if (p[i] < 0) {
            tMin = Math.max(tMin, t)
        } else {
            tMax = Math.min(tMax, t)
        }

        if (tMin > tMax) return false
    }

    return true
}
