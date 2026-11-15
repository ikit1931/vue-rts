import { isWorldPointInsideMap } from '@/game/world/bounds.js'
import { createBuilding, createGameObject, createUnit } from '@/game/world/gameObject.js'
import { advanceGameObject } from '@/game/world/movement.js'
import { snapToWorldGrid } from '@/game/world/worldUnits.js'

export default {
    namespaced: true,
    state() {
        return {
            selectedId: null,
            buildMode: { active: false, sizeN: 1 },
            list: [
                //TODO PLACEHOLDER, нужно делать нормальные конфиги для каждых юнитов
                createUnit({ id: 'a', wx: 0, wy: 0, radius: 16 }),
                createUnit({ id: 'b', wx: 120, wy: 80, radius: 16, stats: { speed: 220 } }),
            ],
        }
    },
    getters: {
        units: (state) => state.list,
        selectedId: (state) => state.selectedId,
        buildMode: (state) => state.buildMode,
        selectedObject: (state) => state.list.find((item) => item.id === state.selectedId) ?? null,
    },
    mutations: {
        SELECT(state, id) {
            state.selectedId = id
        },
        SET_BUILD_MODE(state, { active, sizeN = 1 }) {
            state.buildMode = { active: Boolean(active), sizeN: Math.max(1, sizeN) }
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
    },
    actions: {
        select({ commit }, id) {
            commit('SELECT', id)
        },
        setBuildMode({ commit }, payload) {
            commit('SET_BUILD_MODE', payload)
        },
        toggleBuildSize({ state, commit }, sizeN) {
            const same = state.buildMode.active && state.buildMode.sizeN === sizeN
            commit('SET_BUILD_MODE', { active: !same, sizeN })
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
            if (!isWorldPointInsideMap(snapped.wx, snapped.wy)) return null

            const occupied = state.list.some(
                (item) =>
                    item.type === 'building' &&
                    item.wx === snapped.wx &&
                    item.wy === snapped.wy,
            )
            if (occupied) return null

            const building = createBuilding({
                wx: snapped.wx,
                wy: snapped.wy,
                sizeN: state.buildMode.sizeN,
            })
            commit('ADD_OBJECT', building)
            return building
        },
    },
}
