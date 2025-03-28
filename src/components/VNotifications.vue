<script setup>
import { useNotificationsStore } from '@/stores/notificationsStore'
import VBaseSnackbar from './VBaseSnackbar.vue'

/************************************
 * Stores
 ************************************/
const notificationsStore = useNotificationsStore() // Accesses the notifications store
</script>

<template>
  <VBaseSnackbar
    v-model="notificationsStore.showSnackbar.show"
    :message="notificationsStore.showSnackbar.message"
    :color="notificationsStore.showSnackbar.color"
    :prepend-icon="notificationsStore.showSnackbar.prependIcon"
    :append-icon="notificationsStore.showSnackbar.appendIcon"
  >
  </VBaseSnackbar>
</template>
