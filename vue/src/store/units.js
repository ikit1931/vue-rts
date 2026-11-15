import { BUILDING_TYPES } from '@/game/config/buildingTypes.js'
import { AVAILABLE_GROUPS, DEFAULT_GROUP } from '@/game/config/groups.js'
import { getUnitTypeConfig } from '@/game/config/unitTypes.js'
import { isBuildingInsideMap, isWorldPointInsideMap } from '@/game/world/bounds.js'
import { advanceCombat, canAttackTarget } from '@/game/world/combat.js'
import { formationSlots } from '@/game/world/formation.js'
import { createBuilding, createGameObject, createUnit } from '@/game/world/gameObject.js'
import { advanceGameObject } from '@/game/world/movement.js'
import { buildingHalfExtent, buildingsOverlap, snapToWorldGrid } from '@/game/world/worldUnits.js'

export default {
    namespaced: true,
    state() {
        return {
            selectedIds: [],
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
        selectedIds: (state) => state.selectedIds,
        activeGroup: (state) => state.activeGroup,
        availableGroups: () => AVAILABLE_GROUPS,
        buildMode: (state) => state.buildMode,
        selectedObjects: (state) => state.list.filter((item) => state.selectedIds.includes(item.id)),
        selectedUnits: (state, getters) => getters.selectedObjects.filter((item) => item.type === 'unit'),
        selectedObject: (state, getters) =>
            getters.selectedObjects.length === 1 ? getters.selectedObjects[0] : null,
        canSpawnFromSelected: (state, getters) => {
            const selected = getters.selectedObject
            return Boolean(selected?.type === 'building' && selected.spawnUnitType)
        },
    },
    mutations: {
        SET_SELECTION(state, ids) {
            state.selectedIds = ids
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
                unit.attackTargetId = null
            }
        },
        SET_ATTACK_TARGET(state, { id, targetId }) {
            const unit = state.list.find((item) => item.id === id)
            if (unit) {
                unit.attackTargetId = targetId
                unit.destination = null
            }
        },
        ADVANCE(state, elapsedSeconds) {
            for (const item of state.list) advanceGameObject(item, elapsedSeconds)
            const destroyedIds = advanceCombat(state.list, elapsedSeconds)
            if (destroyedIds.length > 0) {
                state.list = state.list.filter((item) => !destroyedIds.includes(item.id))
                state.selectedIds = state.selectedIds.filter((id) => !destroyedIds.includes(id))
            }
        },
        ADD_OBJECT(state, object) {
            if (!state.list.some((item) => item.id === object.id)) state.list.push(object)
        },
        REMOVE_OBJECT(state, id) {
            state.list = state.list.filter((item) => item.id !== id)
            state.selectedIds = state.selectedIds.filter((selectedId) => selectedId !== id)
        },
    },
    actions: {
        select({ commit }, id) {
            commit('SET_SELECTION', id ? [id] : [])
        },
        toggleSelect({ state, commit }, id) {
            const object = state.list.find((item) => item.id === id)
            if (!object) return
            if (object.type !== 'unit') {
                commit('SET_SELECTION', [id])
                return
            }
            const selectedUnitIds = state.list
                .filter((item) => item.type === 'unit' && state.selectedIds.includes(item.id))
                .map((item) => item.id)
            commit(
                'SET_SELECTION',
                selectedUnitIds.includes(id)
                    ? selectedUnitIds.filter((selectedId) => selectedId !== id)
                    : [...selectedUnitIds, id],
            )
        },
        selectMany({ state, commit }, { ids, additive = false }) {
            const kept = additive
                ? state.list
                    .filter((item) => item.type === 'unit' && state.selectedIds.includes(item.id))
                    .map((item) => item.id)
                : []
            commit('SET_SELECTION', [...new Set([...kept, ...ids])])
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
        commandSelected({ state, getters, commit }, { wx, wy, targetId = null }) {
            const units = getters.selectedUnits
            if (units.length === 0) return

            const target = targetId ? state.list.find((item) => item.id === targetId) : null
            const attackers = target ? units.filter((unit) => canAttackTarget(unit, target)) : []
            for (const unit of attackers) {
                commit('SET_ATTACK_TARGET', { id: unit.id, targetId: target.id })
            }

            const movers = units.filter((unit) => !attackers.includes(unit))
            if (movers.length > 0 && isWorldPointInsideMap(wx, wy)) {
                const slots = formationSlots(wx, wy, movers.length)
                movers.forEach((unit, index) => {
                    commit('SET_DESTINATION', { id: unit.id, ...slots[index] })
                })
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
            const units = getters.selectedUnits
            for (const unit of units) commit('REMOVE_OBJECT', unit.id)
            return units.length > 0
        },
    },
}