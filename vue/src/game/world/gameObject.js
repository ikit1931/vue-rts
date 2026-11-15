import { DEFAULT_BUILDING_STATS, DEFAULT_UNIT_STATS } from './stats.js'

let nextObjectId = 1

function generateObjectId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `game-object-${Date.now()}-${nextObjectId++}`
}

/** Creates a plain, Vuex-friendly game object that can be extended by type. */
export function createGameObject({
  id = generateObjectId(),
  type = 'unit',
  wx = 0,
  wy = 0,
  radius = 16,
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
    destination: destination ? { wx: destination.wx, wy: destination.wy } : null,
    stats: { ...stats },
    ...properties,
  }
}

export function createUnit(config = {}) {
  const { stats = {}, ...rest } = config
  return createGameObject({
    type: 'unit',
    ...rest,
    stats: { ...DEFAULT_UNIT_STATS, ...stats },
  })
}

export function createBuilding(config = {}) {
  const { stats = {}, ...rest } = config
  return createGameObject({
    type: 'building',
    ...rest,
    stats: { ...DEFAULT_BUILDING_STATS, ...stats, speed: 0 },
  })
}
