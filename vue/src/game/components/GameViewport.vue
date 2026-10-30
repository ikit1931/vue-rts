<template>
  <div ref="viewportEl" class="game-viewport" tabindex="0">
    <svg
      v-if="viewportSize.width && viewportSize.height"
      class="game-iso-grid"
      :width="viewportSize.width"
      :height="viewportSize.height"
    >
      <line
        v-for="(segment, index) in gridLines"
        :key="index"
        :x1="segment.x1"
        :y1="segment.y1"
        :x2="segment.x2"
        :y2="segment.y2"
      />
    </svg>
    <slot />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { useStore } from 'vuex'
import { useCameraPan } from '../camera/useCameraPan.js'
import { buildIsometricGridLines } from '../world/isometricGridLines.js'

const store = useStore()
const camera = computed(() => store.getters['camera/camera'])

const viewportEl = ref(null)
const viewportSize = ref({ width: 0, height: 0 })

provide('gameViewportSize', viewportSize)

const gridLines = computed(() =>
  buildIsometricGridLines(camera.value, viewportSize.value),
)

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
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
}

.game-iso-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;

  line {
    stroke: rgb(255 255 255 / 14%);
    stroke-width: 1;
  }
}
</style>
