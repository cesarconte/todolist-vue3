<script setup>
import { useNotificationsStore } from '@/stores/notificationsStore'

const notificationsStore = useNotificationsStore()
</script>

<template>
  <div class="notifications-container">
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
  </div>
</template>
