<template>
  <g
    class="game-world-object"
    :transform="`translate(${position.px} ${position.py})`"
  >
    <circle
      r="8"
      class="game-world-object__marker"
    />
  </g>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { worldToProjectedPlane } from '../world/coordinates.js'

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

const store = useStore()
const camera = computed(() => store.getters['camera/camera'])

const position = computed(() =>
  worldToProjectedPlane(props.wx, props.wy, camera.value),
)
</script>

<style scoped lang="scss">
.game-world-object__marker {
  fill: #c9a227;
  stroke: #1a1208;
  stroke-width: 2;
}
</style>
