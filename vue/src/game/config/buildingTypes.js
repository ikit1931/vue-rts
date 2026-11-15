export const BUILDING_TYPES = {
  outpost: {
    sizeN: 1,
    spawnUnitType: 'scout',
  },
  barracks: {
    sizeN: 2,
    spawnUnitType: 'soldier',
  },
  warehouse: {
    sizeN: 3,
    spawnUnitType: null,
  },
}

export const BUILD_OPTIONS = Object.entries(BUILDING_TYPES).map(([buildingType, config]) => ({
  buildingType,
  ...config,
}))
