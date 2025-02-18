<script setup>
import { computed } from 'vue'
import { useNotificationsStore } from '@/stores/notificationsStore.js' // Import the store

const notificationsStore = useNotificationsStore() // Access the store

const switchLabel = computed(() => {
  return notificationsStore.notificationSettings.enabled ? 'Notifications enabled' : 'Notifications disabled'
})

const switchColor = computed(() => {
  return notificationsStore.notificationSettings.enabled ? 'red-darken-2' : 'black'
})

const switchTextColor = computed(() => {
  return notificationsStore.notificationSettings.enabled ? 'text-red-darken-2' : 'text-black'
})

const notificationTimeOptions = [
  { title: '1 day before', value: 24 },
  { title: '12 hours before', value: 12 },
  { title: '6 hours before', value: 6 },
  { title: '3 hours before', value: 3 },
  { title: '2 hours before', value: 2 },
  { title: '1 hour before', value: 1 },
  { title: '45 minutes before', value: 0.25 },
  { title: '30 minutes before', value: 0.3 },
  { title: '15 minutes before', value: 0.15 },
  { title: '10 minutes before', value: 0.1 },
  { title: '5 minutes before', value: 0.05 }
]
</script>

<template>
  <v-card class="card card-notifications-settings pa-4">
    <v-card-title>Notification Settings</v-card-title>
    <v-divider class="mb-4"></v-divider>
    <v-card-text>
      <v-switch
        v-model="notificationsStore.notificationSettings.enabled"
        :label="switchLabel"
        :color="switchColor"
        inset
        hide-details
        class="mb-4"
        :class="switchTextColor"
      />
      <v-select
        v-model="notificationsStore.notificationSettings.time"
        :items="notificationTimeOptions"
        item-value="value"
        item-title="title"
        label="Notify me"
        variant="outlined"
        :color="switchColor"
        hide-details
        dense
        rounded
        multiple
        clearable
        chips
        closable-chips
        auto-select-first
        :class="switchTextColor"
        :disabled="!notificationsStore.notificationSettings.enabled"
      ></v-select>
    </v-card-text>
    <v-card-actions>
      <v-btn
        variant="flat"
        color="red-darken-2"
        class="text-none rounded-pill"
        @click="$emit('close')"
      >
        <v-icon class="mr-2">mdi-close</v-icon>Close
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
