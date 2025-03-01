<script setup>
import { useNotificationsStore } from '@/stores/notificationsStore'

const notificationsStore = useNotificationsStore()
</script>

<template>
  <div class="notifications-container">
    <v-snackbar
      v-for="notification in notificationsStore.activeNotifications"
      :key="notification.id"
      v-model="notification.show"
      :timeout="6000"
      color="red-darken-2"
      location="bottom right"
    >
      {{ notification.message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          icon="mdi-close"
          @click="notification.show = false"
        />
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
.notifications-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
</style>