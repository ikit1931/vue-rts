export const WORLD_USES_ISOMETRIC_PROJECTION_2_TO_1 = true

export const WORLD_GRID_SIZE = 40

export const ISO_TILE_WIDTH = 64

export const ISO_TILE_HEIGHT = 32

export function snapToWorldGrid(wx, wy) {
    return {
        wx: Math.round(wx / WORLD_GRID_SIZE) * WORLD_GRID_SIZE,
        wy: Math.round(wy / WORLD_GRID_SIZE) * WORLD_GRID_SIZE,
    }
}

export function buildingHalfExtent(sizeN) {
    const n = Number.isFinite(sizeN) ? sizeN : 1
    return (Math.max(1, n) * WORLD_GRID_SIZE) / 2
}

export function buildingsOverlap(a, b) {
    const threshold = buildingHalfExtent(a.sizeN) + buildingHalfExtent(b.sizeN)
    return Math.abs(a.wx - b.wx) < threshold && Math.abs(a.wy - b.wy) < threshold
}

export function objectsOverlap(a, b) {
    const aIsBuilding = a.type === 'building'
    const bIsBuilding = b.type === 'building'

    if (aIsBuilding && bIsBuilding) {
        return buildingsOverlap(a, b)
    }

    if (!aIsBuilding && !bIsBuilding) {
        const minDistance = (a.radius ?? 16) + (b.radius ?? 16)
        const dx = a.wx - b.wx
        const dy = a.wy - b.wy

        return dx * dx + dy * dy < minDistance * minDistance
    }

    const unit = aIsBuilding ? b : a
    const building = aIsBuilding ? a : b

    const half = buildingHalfExtent(building.sizeN ?? 1)

    const closestX = Math.max(
        building.wx - half,
        Math.min(unit.wx, building.wx + half)
    )

    const closestY = Math.max(
        building.wy - half,
        Math.min(unit.wy, building.wy + half)
    )

    const dx = unit.wx - closestX
    const dy = unit.wy - closestY

    const radius = unit.radius ?? 16

    return dx * dx + dy * dy < radius * radius
}