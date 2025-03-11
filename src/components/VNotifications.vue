<script setup>
import { useNotificationsStore } from '@/stores/notificationsStore'
import { watch } from 'vue'

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
      }, 6000)
    }
  }
)
</script>

<template>
  <v-snackbar
    v-model="notificationsStore.showSnackbar.show"
    :message="notificationsStore.showSnackbar.message"
    :timeout="6000"
    color="warning"
    rounded="pill"
    variant="flat"
    opacity="1"
    elevation="6"
    location="top"
    z-index="1000"
    position="sticky"
  >
    <v-icon start icon="mdi-bell-ring"></v-icon>
    {{ notificationsStore.showSnackbar.message }}
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        class="text-none"
        icon="mdi-close"
        @click="notificationsStore.showSnackbar.show = false"
      >
      </v-btn>
    </template>
  </v-snackbar>
</template>
