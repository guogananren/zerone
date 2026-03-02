<script setup lang="ts">
import ChatBot from './components/ChatBot.vue'
</script>

<template>
  <div class="chat-page">
    <div class="chat-container">
      <ChatBot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@@/assets/styles/variables.scss' as *;

.chat-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $zerone-bg-light;
}

.chat-container {
  width: 100%;
  max-width: 920px;
  height: 90vh;
  max-height: 780px;
  background: $zerone-bg-white;
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  overflow: hidden;
}
</style>
