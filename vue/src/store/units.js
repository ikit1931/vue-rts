import { BUILDING_TYPES } from '@/game/config/buildingTypes.js'
import { AVAILABLE_GROUPS, DEFAULT_GROUP } from '@/game/config/groups.js'
import { getUnitTypeConfig } from '@/game/config/unitTypes.js'
import { isBuildingInsideMap, isWorldPointInsideMap } from '@/game/world/bounds.js'
import { createBuilding, createGameObject, createUnit } from '@/game/world/gameObject.js'
import { advanceGameObject } from '@/game/world/movement.js'
import { buildingHalfExtent, buildingsOverlap, snapToWorldGrid } from '@/game/world/worldUnits.js'

export default {
    namespaced: true,
    state() {
        return {
            selectedId: null,
            activeGroup: DEFAULT_GROUP,
            buildMode: {
                active: false,
                sizeN: 1,
                buildingType: null,
                spawnUnitType: null,
            },
            list: [
                createUnit({ id: 'a', wx: 0, wy: 0, radius: 16, group: 1 }),
                createUnit({ id: 'b', wx: 120, wy: 80, radius: 16, group: 2, stats: { speed: 220 } }),
                createBuilding({
                    id: 'enemy-barracks',
                    wx: 200,
                    wy: -80,
                    sizeN: BUILDING_TYPES.barracks.sizeN,
                    buildingType: 'barracks',
                    spawnUnitType: BUILDING_TYPES.barracks.spawnUnitType,
                    group: 2,
                }),
            ],
        }
    },
    getters: {
        units: (state) => state.list,
        selectedId: (state) => state.selectedId,
        activeGroup: (state) => state.activeGroup,
        availableGroups: () => AVAILABLE_GROUPS,
        buildMode: (state) => state.buildMode,
        selectedObject: (state) => state.list.find((item) => item.id === state.selectedId) ?? null,
        canSpawnFromSelected: (state, getters) => {
            const selected = getters.selectedObject
            return Boolean(selected?.type === 'building' && selected.spawnUnitType)
        },
    },
    mutations: {
        SELECT(state, id) {
            state.selectedId = id
        },
        SET_ACTIVE_GROUP(state, group) {
            state.activeGroup = AVAILABLE_GROUPS.includes(group) ? group : DEFAULT_GROUP
        },
        SET_BUILD_MODE(state, {
            active,
            sizeN = 1,
            buildingType = null,
            spawnUnitType = null,
        }) {
            state.buildMode = {
                active: Boolean(active),
                sizeN: Math.max(1, sizeN),
                buildingType,
                spawnUnitType,
            }
        },
        SET_DESTINATION(state, { id, wx, wy }) {
            const unit = state.list.find((item) => item.id === id)
            if (unit) {
                unit.destination = { wx, wy }
            }
        },
        ADVANCE(state, elapsedSeconds) {
            for (const item of state.list) advanceGameObject(item, elapsedSeconds)
        },
        ADD_OBJECT(state, object) {
            if (!state.list.some((item) => item.id === object.id)) state.list.push(object)
        },
        REMOVE_OBJECT(state, id) {
            state.list = state.list.filter((item) => item.id !== id)
            if (state.selectedId === id) state.selectedId = null
        },
    },
    actions: {
        select({ commit }, id) {
            commit('SELECT', id)
        },
        setActiveGroup({ commit }, group) {
            commit('SET_ACTIVE_GROUP', group)
        },
        setBuildMode({ commit }, payload) {
            commit('SET_BUILD_MODE', payload)
        },
        toggleBuildOption({ state, commit }, option) {
            const same =
                state.buildMode.active && state.buildMode.buildingType === option.buildingType
            commit('SET_BUILD_MODE', {
                active: !same,
                sizeN: option.sizeN,
                buildingType: option.buildingType,
                spawnUnitType: option.spawnUnitType ?? null,
            })
        },
        moveSelectedTo({ state, commit }, { wx, wy }) {
            const selected = state.list.find((item) => item.id === state.selectedId)
            if (selected?.type === 'unit' && isWorldPointInsideMap(wx, wy)) {
                commit('SET_DESTINATION', { id: state.selectedId, wx, wy })
            }
        },
        advance({ commit }, elapsedSeconds) {
            commit('ADVANCE', elapsedSeconds)
        },
        addObject({ commit }, config) {
            const object = createGameObject(config)
            commit('ADD_OBJECT', object)
            return object
        },
        placeBuilding({ state, commit }, { wx, wy }) {
            if (!state.buildMode.active) return null
            const snapped = snapToWorldGrid(wx, wy)
            const sizeN = state.buildMode.sizeN
            if (!isBuildingInsideMap(snapped.wx, snapped.wy, sizeN)) return null

            const occupied = state.list.some(
                (item) =>
                    item.type === 'building' &&
                    buildingsOverlap(item, { wx: snapped.wx, wy: snapped.wy, sizeN }),
            )
            if (occupied) return null

            const building = createBuilding({
                wx: snapped.wx,
                wy: snapped.wy,
                sizeN,
                buildingType: state.buildMode.buildingType,
                spawnUnitType: state.buildMode.spawnUnitType,
                group: state.activeGroup,
            })
            commit('ADD_OBJECT', building)
            return building
        },
        spawnNearSelected({ getters, commit }) {
            const building = getters.selectedObject
            if (building?.type !== 'building' || !building.spawnUnitType) return null

            const unitConfig = getUnitTypeConfig(building.spawnUnitType)
            if (!unitConfig) return null

            const half = buildingHalfExtent(building.sizeN ?? 1)
            const radius = unitConfig.radius ?? 16
            const offset = half + radius
            const spawnCandidates = [
                { wx: building.wx + offset, wy: building.wy },
                { wx: building.wx - offset, wy: building.wy },
                { wx: building.wx, wy: building.wy - offset },
                { wx: building.wx, wy: building.wy + offset },
            ]
            const spawnPoint = spawnCandidates.find(
                (point) =>
                    isWorldPointInsideMap(point.wx - radius, point.wy - radius) &&
                    isWorldPointInsideMap(point.wx + radius, point.wy - radius) &&
                    isWorldPointInsideMap(point.wx + radius, point.wy + radius) &&
                    isWorldPointInsideMap(point.wx - radius, point.wy + radius),
            )
            if (!spawnPoint) return null

            const unit = createUnit({
                wx: spawnPoint.wx,
                wy: spawnPoint.wy,
                radius,
                unitType: building.spawnUnitType,
                stats: unitConfig.stats,
                group: building.group ?? DEFAULT_GROUP,
            })
            commit('ADD_OBJECT', unit)
            return unit
        },
        destroySelected({ getters, commit }) {
            const selected = getters.selectedObject
            if (selected?.type !== 'unit') return false
            commit('REMOVE_OBJECT', selected.id)
            return true
        },
    },
}
