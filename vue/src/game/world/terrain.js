import {worldToProjectedPlane} from './coordinates.js'
import {WORLD_GRID_SIZE, ISO_TILE_WIDTH, ISO_TILE_HEIGHT} from './worldUnits.js'

export const TERRAIN_TYPES = {
    LAND: 'land',
    WATER: 'water',
}

const LAKE = {
    wx: -320,
    wy: -320,
    radiusWx: 160,
    radiusWy: 120,
}

export function getTerrainTypeAt(wx, wy) {
    const cellWx = Math.round(wx / WORLD_GRID_SIZE) * WORLD_GRID_SIZE
    const cellWy = Math.round(wy / WORLD_GRID_SIZE) * WORLD_GRID_SIZE

    const dx = (cellWx - LAKE.wx) / LAKE.radiusWx
    const dy = (cellWy - LAKE.wy) / LAKE.radiusWy

    return dx * dx + dy * dy <= 1
        ? TERRAIN_TYPES.WATER
        : TERRAIN_TYPES.LAND
}

export function isTerrainSuitable(wx, wy, radius, terrainType) {
    if (getTerrainTypeAt(wx, wy) !== terrainType) return false

    const safeRadius = Number.isFinite(radius) ? Math.max(0, radius) : 0
    if (safeRadius === 0) return true

    const diagonal = safeRadius / Math.SQRT2
    const offsets = [
        [safeRadius, 0],
        [-safeRadius, 0],
        [0, safeRadius],
        [0, -safeRadius],
        [diagonal, diagonal],
        [diagonal, -diagonal],
        [-diagonal, diagonal],
        [-diagonal, -diagonal],
    ]

    return offsets.every(([dx, dy]) =>
        getTerrainTypeAt(wx + dx, wy + dy) === terrainType
    )
}

export function isTerrainAreaSuitable(wx, wy, halfExtent, terrainType) {
    const step = WORLD_GRID_SIZE / 4

    for (let offsetX = -halfExtent; offsetX <= halfExtent; offsetX += step) {
        for (let offsetY = -halfExtent; offsetY <= halfExtent; offsetY += step) {
            if (getTerrainTypeAt(wx + offsetX, wy + offsetY) !== terrainType) {
                return false
            }
        }
    }

    return true
}

export function isTerrainSegmentValid(ax, ay, bx, by, radius, terrainType) {
    const distance = Math.hypot(bx - ax, by - ay)
    const steps = Math.max(1, Math.ceil(distance / (WORLD_GRID_SIZE / 4)))

    for (let i = 0; i <= steps; i++) {
        const progress = i / steps
        const wx = ax + (bx - ax) * progress
        const wy = ay + (by - ay) * progress

        if (!isTerrainSuitable(wx, wy, radius, terrainType)) {
            return false
        }
    }

    return true
}

export function buildWaterTiles(camera) {
    const tiles = []

    const minWx = LAKE.wx - LAKE.radiusWx
    const maxWx = LAKE.wx + LAKE.radiusWx
    const minWy = LAKE.wy - LAKE.radiusWy
    const maxWy = LAKE.wy + LAKE.radiusWy

    for (let wx = minWx; wx <= maxWx; wx += WORLD_GRID_SIZE) {
        for (let wy = minWy; wy <= maxWy; wy += WORLD_GRID_SIZE) {
            if (getTerrainTypeAt(wx, wy) !== TERRAIN_TYPES.WATER) continue

            const {px, py} = worldToProjectedPlane(wx, wy, camera)
            const halfWidth = ISO_TILE_WIDTH / 2
            const halfHeight = ISO_TILE_HEIGHT / 2

            tiles.push({
                key: `${wx},${wy}`,
                points: [
                    `${px},${py - halfHeight}`,
                    `${px + halfWidth},${py}`,
                    `${px},${py + halfHeight}`,
                    `${px - halfWidth},${py}`,
                ].join(' '),
            })
        }
    }

    return tiles
}