<script setup>
import { RouterView } from 'vue-router'
import VToolbar from '@/components/VToolbar.vue'
import VFooter from '@/components/VFooter.vue'
import VNotifications from '@/components/VNotifications.vue'
</script>

<template>
  <v-app>
    <header>
      <VToolbar />
    </header>
    <v-main>
      <RouterView />
    </v-main>
    <VFooter />
    <VNotifications />
  </v-app>
</template>

<style scoped>
.v-main {
  min-height: 100vh;
}
</style>
