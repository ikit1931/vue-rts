<template>
  <div class="game-page">
    <GameViewport>
      <GameWorldObject
        v-for="stub in worldStubs"
        :key="stub.id"
        :wx="stub.wx"
        :wy="stub.wy"
      />
    </GameViewport>
  </div>
</template>

<script setup>
import { GameViewport, GameWorldObject } from '@/game'

const worldStubs = [
  { id: 'a', wx: 0, wy: 0 },
  { id: 'b', wx: 120, wy: 80 },
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
</style>
