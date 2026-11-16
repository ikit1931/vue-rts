
export const BUILDING_TYPES = {
  outpost: {
    label: 'аванпост',
    sizeN: 1,
    terrainType: 'land',
    spawnUnitType: 'scout',
  },
  barracks: {
    label: 'казарма',
    sizeN: 2,
    terrainType: 'land',
    spawnUnitType: 'soldier',
  },
  warehouse: {
    label: 'склад',
    sizeN: 3,
    terrainType: 'land',
    spawnUnitType: null,
  },
  shipyard: {
    label: 'верфь',
    sizeN: 2,
    terrainType: 'water',
    spawnUnitType: 'ship',
  },
}

export const BUILD_OPTIONS = Object.entries(BUILDING_TYPES).map(([buildingType, config]) => ({
  buildingType,
  ...config,
}))