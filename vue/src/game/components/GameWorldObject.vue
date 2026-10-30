<template>
  <div class="game-world-object" :style="placementStyle">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameMap } from '../composables/useGameMap.js'

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

const { worldToScreen } = useGameMap()

const placementStyle = computed(() => {
  const { sx, sy } = worldToScreen(props.wx, props.wy)
  return {
    left: `${sx}px`,
    top: `${sy}px`,
  }
})
</script>

<style scoped lang="scss">
.game-world-object {
  position: absolute;
  transform: translate(-50%, -100%);
}
</style>
