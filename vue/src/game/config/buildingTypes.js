export const BUILDING_TYPES = {
  outpost: {
    buildingType: 'outpost',
    sizeN: 1,
    spawnUnitType: 'scout',
  },
  barracks: {
    buildingType: 'barracks',
    sizeN: 2,
    spawnUnitType: 'soldier',
  },
  warehouse: {
    buildingType: 'warehouse',
    sizeN: 3,
    spawnUnitType: null,
  },
}

export const BUILD_OPTIONS = [
  BUILDING_TYPES.outpost,
  BUILDING_TYPES.barracks,
  BUILDING_TYPES.warehouse,
]

export function getBuildingTypeBySize(sizeN) {
  return BUILD_OPTIONS.find((item) => item.sizeN === sizeN) ?? null
}
