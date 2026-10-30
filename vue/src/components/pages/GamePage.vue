<template>
  <div class="game-page">
    <GameViewport />
  </div>
</template>

<script setup>
import GameViewport from '@/game/components/GameViewport.vue'
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
