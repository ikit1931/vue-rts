<template>
  <aside class="game-nav-panel">
    <p class="game-nav-panel__title">Постройка</p>
    <div class="game-nav-panel__row">
      <button
        v-for="sizeN in buildingSizes"
        :key="sizeN"
        type="button"
        class="game-nav-panel__btn"
        :class="{ 'game-nav-panel__btn--active': isBuildSizeActive(sizeN) }"
        @click="onBuildSizeClick(sizeN)"
      >
        {{ sizeN }}x{{ sizeN }}
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const buildingSizes = [1, 2, 3]

const store = useStore()
const buildMode = computed(() => store.getters['units/buildMode'])

function isBuildSizeActive(sizeN) {
  return buildMode.value.active && buildMode.value.sizeN === sizeN
}

function onBuildSizeClick(sizeN) {
  store.dispatch('units/toggleBuildSize', sizeN)
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
}
</style>
