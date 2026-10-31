<template>
  <div class="game-page">
    <GameViewport @world-click="onWorldClick">
      <GameDestinationMarker
          v-for="unit in unitsWithDestination"
          :key="`destination-${unit.id}`"
          :wx="unit.destination.wx"
          :wy="unit.destination.wy"
      />
      <GameWorldObject
          v-for="unit in units"
          :key="unit.id"
          :wx="unit.wx"
          :wy="unit.wy"
          :radius="unit.radius"
          :selected="unit.id === selectedId"
      />
    </GameViewport>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { GameDestinationMarker, GameViewport, GameWorldObject } from '@/game'

const LEFT_BUTTON = 0
const RIGHT_BUTTON = 2

const store = useStore()
const units = computed(() => store.getters['units/units'])
const selectedId = computed(() => store.getters['units/selectedId'])
const unitsWithDestination = computed(() => units.value.filter((unit) => unit.destination))

function onWorldClick({ button, wx, wy }) {
  if (button === LEFT_BUTTON) {
    let hit = null
    let hitDistance = Infinity
    for (const unit of units.value) {
      const distance = Math.hypot(unit.wx - wx, unit.wy - wy)
      if (distance <= unit.radius && distance < hitDistance) {
        hit = unit
        hitDistance = distance
      }
    }
    store.dispatch('units/select', hit ? hit.id : null)
  } else if (button === RIGHT_BUTTON) {
    store.dispatch('units/moveSelectedTo', { wx, wy })
  }
}
</script>

<style scoped lang="scss">
.game-page {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>