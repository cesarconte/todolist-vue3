// VNotifications.vue
<script setup>
import { useNotificationsStore } from '@/stores/notificationsStore'
import BaseSnackbar from './BaseSnackbar.vue'

/************************************
 * Stores
 ************************************/
const notificationsStore = useNotificationsStore() // Accesses the notifications store
</script>

<template>
  <BaseSnackbar
    v-model="notificationsStore.showSnackbar.show"
    :message="notificationsStore.showSnackbar.message"
    :color="notificationsStore.showSnackbar.color"
    :prepend-icon="notificationsStore.showSnackbar.prependIcon"
    :append-icon="notificationsStore.showSnackbar.appendIcon"
  >
  </BaseSnackbar>
</template>
