<script setup>
import { useNotificationsStore } from '@/stores/notificationsStore'
import { watch, computed } from 'vue'
import VBaseSnackbar from './VBaseSnackbar.vue'

/************************************
 * Stores
 ************************************/
const notificationsStore = useNotificationsStore() // Accesses the notifications store

/************************************
 * Watchers
 ************************************/
// Reset the snackbar after 6 seconds
watch(
  () => notificationsStore.showSnackbar.show, // Watches for changes in showSnackbar.show
  (newVal) => {
    // Callback function executed when showSnackbar.show changes
    if (newVal) {
      // If showSnackbar.show is true (snackbar is shown)
      setTimeout(() => {
        // Set a timeout to close the snackbar after 6 seconds
        notificationsStore.showSnackbar.show = false // Close the snackbar
      }, 4000)
    }
  }
)

/************************************
 * Computed
 ************************************/
const notificationColor = computed(() => {
  if (notificationsStore.showSnackbar.message.includes('error')) {
    return 'error'
  } else if (notificationsStore.showSnackbar.message.includes('success')) {
    return 'success'
  } else if (notificationsStore.showSnackbar.message.includes('info')) {
    return 'info'
  } else {
    return 'warning'
  }
})
</script>

<template>
  <VBaseSnackbar
    v-model="notificationsStore.showSnackbar.show"
    :message="notificationsStore.showSnackbar.message"
    :color="notificationColor"
    :prepend-icon="notificationsStore.showSnackbar.prependIcon"
  >
  </VBaseSnackbar>
</template>
