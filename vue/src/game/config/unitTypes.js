
import { DEFAULT_UNIT_STATS } from '../world/stats.js'

export const UNIT_TYPES = {
  soldier: {
    label: 'пехотинец',
    terrainType: 'land',
    radius: 16,
    stats: { ...DEFAULT_UNIT_STATS },
  },
  scout: {
    label: 'разведчик',
    terrainType: 'land',
    radius: 14,
    stats: { ...DEFAULT_UNIT_STATS, speed: 180, attack: 6, hp: 70 },
  },
  ship: {
    label: 'корабль',
    terrainType: 'water',
    radius: 18,
    stats: { ...DEFAULT_UNIT_STATS, speed: 140 },
  },
}

export function getUnitTypeConfig(unitType) {
  return UNIT_TYPES[unitType] ?? null
}