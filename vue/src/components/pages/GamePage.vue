<template>
  <div class="game-page">
    <GameViewport>
      <GameWorldObject
        v-for="stub in worldStubs"
        :key="stub.id"
        :wx="stub.wx"
        :wy="stub.wy"
      >
        <div class="world-stub" />
      </GameWorldObject>
    </GameViewport>
  </div>
</template>

<script setup>
import GameViewport from '@/game/components/GameViewport.vue'
import GameWorldObject from '@/game/components/GameWorldObject.vue'

const worldStubs = [
  { id: 'a', wx: 80, wy: 40 },
  { id: 'b', wx: -120, wy: 60 },
]
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

.world-stub {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #c9a227;
  border: 2px solid #1a1208;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 35%);
}
</style>
