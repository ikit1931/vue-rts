import { clampCameraWorldCenter } from '@/game/camera/cameraBounds.js'
import {
  createCameraAtWorldCenter,
  translateCameraWorldCenter,
} from '@/game/camera/cameraModel.js'

export default {
  namespaced: true,
  state() {
    return {
      camera: createCameraAtWorldCenter(),
    }
  },
  getters: {
    camera: (state) => state.camera,
  },
  mutations: {
    SET_CAMERA(state, camera) {
      state.camera = clampCameraWorldCenter(camera)
    },
    PAN_CAMERA(state, { deltaWx, deltaWy }) {
      state.camera = clampCameraWorldCenter(
        translateCameraWorldCenter(state.camera, deltaWx, deltaWy),
      )
    },
  },
  actions: {
    panCamera({ commit }, payload) {
      commit('PAN_CAMERA', payload)
    },
  },
}
