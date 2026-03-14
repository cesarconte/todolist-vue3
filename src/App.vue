<script setup>
import { RouterView } from 'vue-router'
import VToolbar from '@/components/layout/VToolbar.vue'
import VFooter from '@/components/layout/VFooter.vue'
import VNotifications from '@/components/notifications/VNotifications.vue'
import VBaseSnackbar from '@/components/notifications/VBaseSnackbar.vue'
import { onMounted } from 'vue'
import { useDataInitialization } from '@/composables/data/useDataInitialization'

const { initializeData } = useDataInitialization()

onMounted(() => {
  initializeData()
})
</script>

<template>
  <v-app>
    <VToolbar />
    <v-main>
      <RouterView />
    </v-main>
    <VFooter />
    <VNotifications />
    <VBaseSnackbar />
  </v-app>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}
main {
  min-height: 80vh;
}
</style>
