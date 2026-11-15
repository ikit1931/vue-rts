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
          :type="unit.type"
          :size-n="unit.sizeN || 1"
          :group="unit.group || 1"
          :selected="unit.id === selectedId"
      />
    </GameViewport>
    <GameNavigationPanel />
    <GameActionPanel />
    <GameStatsPanel />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import {
  GameActionPanel,
  GameDestinationMarker,
  GameNavigationPanel,
  GameStatsPanel,
  GameViewport,
  GameWorldObject,
} from '@/game'
import { buildingHalfExtent } from '@/game/world/worldUnits.js'

const LEFT_BUTTON = 0
const RIGHT_BUTTON = 2

const store = useStore()
const units = computed(() => store.getters['units/units'])
const selectedId = computed(() => store.getters['units/selectedId'])
const buildMode = computed(() => store.getters['units/buildMode'])
const unitsWithDestination = computed(() =>
  units.value.filter((unit) => unit.type === 'unit' && unit.destination),
)

let animationFrameId = null
let previousFrameTime = null

function advanceUnits(frameTime) {
  if (previousFrameTime !== null) {
    // Bound large pauses (for example, switching back to the tab) to avoid teleporting.
    const elapsedSeconds = Math.min((frameTime - previousFrameTime) / 1000, 0.1)
    store.dispatch('units/advance', elapsedSeconds)
  }
  previousFrameTime = frameTime
  animationFrameId = requestAnimationFrame(advanceUnits)
}

onMounted(() => {
  animationFrameId = requestAnimationFrame(advanceUnits)
})

onUnmounted(() => {
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
  previousFrameTime = null
})

function findHitObject(wx, wy) {
  let hit = null
  let hitDistance = Infinity
  for (const object of units.value) {
    if (object.type === 'building') {
      const half = buildingHalfExtent(object.sizeN ?? 1)
      if (Math.abs(object.wx - wx) <= half && Math.abs(object.wy - wy) <= half) {
        const distance = Math.hypot(object.wx - wx, object.wy - wy)
        if (distance < hitDistance) {
          hit = object
          hitDistance = distance
        }
      }
      continue
    }
    const distance = Math.hypot(object.wx - wx, object.wy - wy)
    if (distance <= object.radius && distance < hitDistance) {
      hit = object
      hitDistance = distance
    }
  }
  return hit
}

function onWorldClick({ button, wx, wy }) {
  if (button === LEFT_BUTTON) {
    if (buildMode.value.active) {
      store.dispatch('units/placeBuilding', { wx, wy })
      return
    }
    const hit = findHitObject(wx, wy)
    store.dispatch('units/select', hit ? hit.id : null)
  } else if (button === RIGHT_BUTTON) {
    if (buildMode.value.active) {
      store.dispatch('units/setBuildMode', {
        active: false,
        sizeN: buildMode.value.sizeN,
        buildingType: buildMode.value.buildingType,
        spawnUnitType: buildMode.value.spawnUnitType,
      })
      return
    }
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
