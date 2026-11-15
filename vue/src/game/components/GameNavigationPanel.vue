<template>
  <aside class="game-nav-panel">
    <p class="game-nav-panel__title">Постройка</p>
    <div class="game-nav-panel__row">
      <button
        v-for="option in buildOptions"
        :key="option.sizeN"
        type="button"
        class="game-nav-panel__btn"
        :class="{ 'game-nav-panel__btn--active': isBuildSizeActive(option.sizeN) }"
        @click="onBuildSizeClick(option.sizeN)"
      >
        {{ option.sizeN }}x{{ option.sizeN }}
      </button>
    </div>

    <template v-if="canSpawn">
      <p class="game-nav-panel__title game-nav-panel__title--spaced">Спавн</p>
      <div class="game-nav-panel__row">
        <button type="button" class="game-nav-panel__btn" @click="onSpawnClick">
          {{ spawnLabel }}
        </button>
      </div>
    </template>

    <template v-if="isUnitSelected">
      <p class="game-nav-panel__title game-nav-panel__title--spaced">Персонаж</p>
      <div class="game-nav-panel__row">
        <button type="button" class="game-nav-panel__btn game-nav-panel__btn--danger" @click="onDestroyClick">
          Самоуничтожение
        </button>
      </div>
    </template>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { BUILD_OPTIONS } from '@/game/config/buildingTypes.js'

const buildOptions = BUILD_OPTIONS

const store = useStore()
const buildMode = computed(() => store.getters['units/buildMode'])
const selectedObject = computed(() => store.getters['units/selectedObject'])
const canSpawn = computed(() => store.getters['units/canSpawnFromSelected'])
const isUnitSelected = computed(() => selectedObject.value?.type === 'unit')
const spawnLabel = computed(() => `Создать ${selectedObject.value?.spawnUnitType ?? 'юнита'}`)

function isBuildSizeActive(sizeN) {
  return buildMode.value.active && buildMode.value.sizeN === sizeN
}

function onBuildSizeClick(sizeN) {
  store.dispatch('units/toggleBuildSize', sizeN)
}

function onSpawnClick() {
  store.dispatch('units/spawnNearSelected')
}

function onDestroyClick() {
  store.dispatch('units/destroySelected')
}
</script>

<style scoped lang="scss">
.game-nav-panel {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 2;
  padding: 10px 12px;
  background: rgba(18, 18, 18, 0.85);
  border: 1px solid #555;
  color: #eee;
  font-family: Consolas, "Courier New", monospace;
  font-size: 13px;
  pointer-events: auto;
}

.game-nav-panel__title {
  margin: 0 0 8px;

  &--spaced {
    margin-top: 12px;
  }
}

.game-nav-panel__row {
  display: flex;
  gap: 6px;
}

.game-nav-panel__btn {
  min-width: 48px;
  padding: 6px 8px;
  border: 1px solid #777;
  background: #2a2a2a;
  color: inherit;
  cursor: pointer;

  &:hover {
    border-color: #bbb;
  }

  &--active {
    border-color: #7dff7d;
    background: #1f3a1f;
  }

  &--danger {
    border-color: #a55;
    background: #3a1f1f;

    &:hover {
      border-color: #d77;
    }
  }
}
</style>
