<script setup>
import { RouterView } from 'vue-router'
import TheToolbar from '@/components/layout/TheToolbar.vue'
import TheFooter from '@/components/layout/TheFooter.vue'
import NotificationList from '@/components/notifications/NotificationList.vue'
import BaseSnackbar from '@/components/notifications/BaseSnackbar.vue'
import { onMounted } from 'vue'
import { useDataInitialization } from '@/composables/data/useDataInitialization'

const { initializeData } = useDataInitialization()

onMounted(() => {
  initializeData()
})
</script>

<template>
  <v-app>
    <TheToolbar />
    <v-main>
      <RouterView />
    </v-main>
    <TheFooter />
    <NotificationList />
    <BaseSnackbar />
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
