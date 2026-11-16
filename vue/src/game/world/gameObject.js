
import { DEFAULT_GROUP } from '../config/groups.js'
import { getUnitTypeConfig } from '../config/unitTypes.js'
import { BUILDING_TYPES } from '../config/buildingTypes.js'
import { DEFAULT_BUILDING_STATS, DEFAULT_UNIT_STATS } from './stats.js'

let nextObjectId = 1

function generateObjectId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
    return `game-object-${Date.now()}-${nextObjectId++}`
}

export function createGameObject({
                                     id = generateObjectId(),
                                     type = 'unit',
                                     wx = 0,
                                     wy = 0,
                                     radius = 16,
                                     group = DEFAULT_GROUP,
                                     stats = {},
                                     destination = null,
                                     ...properties
                                 } = {}) {
    return {
        id,
        type,
        wx,
        wy,
        radius,
        group,
        destination: destination ? { wx: destination.wx, wy: destination.wy } : null,
        stats: { ...stats },
        ...properties,
    }
}

export function createUnit(config = {}) {
    const { stats = {}, unitType = 'soldier', radius, ...rest } = config
    const unitConfig = getUnitTypeConfig(unitType)
    const mergedStats = {
        ...DEFAULT_UNIT_STATS,
        ...(unitConfig?.stats ?? {}),
        ...stats,
    }

    return createGameObject({
        type: 'unit',
        ...rest,
        unitType,
        radius: radius ?? unitConfig?.radius ?? 16,
        terrainType: unitConfig?.terrainType ?? 'land',
        stats: mergedStats,
        maxHp: mergedStats.hp,
    })
}

export function createBuilding(config = {}) {
    const { stats = {}, sizeN = 1, buildingType = null, ...rest } = config
    const mergedStats = { ...DEFAULT_BUILDING_STATS, ...stats, speed: 0 }

    return createGameObject({
        type: 'building',
        sizeN: Math.max(1, sizeN),
        ...rest,
        buildingType,
        terrainType: BUILDING_TYPES[buildingType]?.terrainType ?? 'land',
        stats: mergedStats,
        maxHp: mergedStats.hp,
    })
}