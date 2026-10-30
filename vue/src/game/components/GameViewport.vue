<template>
  <div ref="viewportEl" class="game-viewport" tabindex="0">
    <div class="game-world" :style="worldLayerStyle">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { useStore } from 'vuex'
import { useCameraPan } from '../camera/useCameraPan.js'
import { WORLD_LAYER_HALF_SIZE, WORLD_LAYER_SIZE } from '../world/worldLayer.js'

const worldLayerSizePx = `${WORLD_LAYER_SIZE}px`

const props = defineProps({
  camera: {
    type: Object,
    default: undefined,
  },
})

const store = useStore()
const camera = computed(() => props.camera ?? store.getters['camera/camera'])

const viewportEl = ref(null)
const viewportSize = ref({ width: 0, height: 0 })

provide('gameViewportSize', viewportSize)

const worldLayerStyle = computed(() => {
  const { width, height } = viewportSize.value
  if (!width || !height) {
    return {}
  }
  const halfW = width / 2
  const halfH = height / 2
  return {
    transform: `translate(${halfW - WORLD_LAYER_HALF_SIZE - camera.value.cameraCenterWx}px, ${halfH - WORLD_LAYER_HALF_SIZE - camera.value.cameraCenterWy}px)`,
  }
})

let resizeObserver

useCameraPan(viewportEl, (deltaWx, deltaWy) => {
  store.dispatch('camera/panCamera', { deltaWx, deltaWy })
})

onMounted(() => {
  viewportEl.value?.focus({ preventScroll: true })
  const syncViewportSize = () => {
    if (!viewportEl.value) {
      return
    }
    viewportSize.value = {
      width: viewportEl.value.clientWidth,
      height: viewportEl.value.clientHeight,
    }
  }
  syncViewportSize()
  resizeObserver = new ResizeObserver(syncViewportSize)
  resizeObserver.observe(viewportEl.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped lang="scss">
.game-viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #1a2e1a;
  cursor: grab;
  outline: none;

  &:active {
    cursor: grabbing;
  }
}

.game-world {
  position: absolute;
  left: 0;
  top: 0;
  width: v-bind(worldLayerSizePx);
  height: v-bind(worldLayerSizePx);
  background-color: #3a5f3a;
  background-image:
    linear-gradient(rgb(255 255 255 / 8%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 8%) 1px, transparent 1px);
  background-size: 48px 48px;
  transform-origin: 0 0;
  will-change: transform;
}
</style>
