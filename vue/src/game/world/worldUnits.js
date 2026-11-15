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
  return (Math.max(1, sizeN) * WORLD_GRID_SIZE) / 2
}
