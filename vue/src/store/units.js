import { isWorldPointInsideMap } from '@/game/world/bounds.js'

export default {
    namespaced: true,
    state() {
        return {
            selectedId: null,
            list: [
                //TODO PLACEHOLDER, нужно делать нормальные конфиги для каждых юнитов
                { id: 'a', wx: 0, wy: 0, radius: 16, destination: null, stats: { speed: 120 } },
                { id: 'b', wx: 120, wy: 80, radius: 16, destination: null, stats: { speed: 220 } },
            ],
        }
    },
    getters: {
        units: (state) => state.list,
        selectedId: (state) => state.selectedId,
    },
    mutations: {
        SELECT(state, id) {
            state.selectedId = id
        },
        SET_DESTINATION(state, { id, wx, wy }) {
            const unit = state.list.find((item) => item.id === id)
            if (unit) {
                unit.destination = { wx, wy }
            }
        },
    },
    actions: {
        select({ commit }, id) {
            commit('SELECT', id)
        },
        moveSelectedTo({ state, commit }, { wx, wy }) {
            if (state.selectedId !== null && isWorldPointInsideMap(wx, wy)) {
                commit('SET_DESTINATION', { id: state.selectedId, wx, wy })
            }
        },
    },
}