<template>
  <div class="game-world-object" :style="placementStyle">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { WORLD_LAYER_HALF_SIZE } from '../world/worldLayer.js'

const props = defineProps({
  wx: {
    type: Number,
    required: true,
  },
  wy: {
    type: Number,
    required: true,
  },
})

const placementStyle = computed(() => ({
  left: `${WORLD_LAYER_HALF_SIZE + props.wx}px`,
  top: `${WORLD_LAYER_HALF_SIZE + props.wy}px`,
}))
</script>

<style scoped lang="scss">
.game-world-object {
  position: absolute;
  transform: translate(-50%, -50%);
}
</style>
