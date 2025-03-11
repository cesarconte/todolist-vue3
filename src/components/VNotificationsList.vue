<script setup>
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useDisplay } from 'vuetify'

/************************************
 * Props & Emits
 ************************************/
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

/************************************
 * Stores
 ************************************/
const notificationsStore = useNotificationsStore() // Accesses the notifications store

/************************************
 * Methods / Functions
 ************************************/
const formatDate = (timestamp) => {
  // Formats a timestamp into a localized date and time string
  return new Date(timestamp).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleCheckboxChange = async (item) => {
  // Marks a notification as read and triggers the shaking animation
  await notificationsStore.markAsRead(item.id)
}

const closeDialog = () => {
  // Closes the dialog by emitting the update:modelValue event
  emit('update:modelValue', false)
}

/************************************
 * Vuetify Display
 ************************************/
const { xs } = useDisplay() // Accesses display breakpoints from Vuetify
</script>

<template>
  <v-dialog
    :model-value="props.modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    max-width="600px"
    class="dialog-notifications-list"
  >
    <v-card class="notification-list-card pa-4 rounded-lg elevation-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h6">Notification List</span>
        <v-btn icon @click="closeDialog" variant="text" color="grey-darken-1">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider class="my-4" />

      <v-card-text class="pa-0">
        <v-list density="compact" class="notification-list">
          <v-list-item v-for="item in notificationsStore.activeNotifications" :key="item.id">
            <template v-slot:prepend>
              <v-checkbox
                :model-value="item.read"
                @click.stop="handleCheckboxChange(item)"
                color="red-darken-2"
                hide-details
              />
            </template>

            <template v-slot:default>
              <v-row align="center">
                <v-icon :icon="item.icon" color="red-darken-2" class="ml-3" />
                <v-col>
                  <v-list-item-title>
                    {{ item.message }}
                  </v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(item.timestamp) }}</v-list-item-subtitle>
                </v-col>
              </v-row>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions :class="xs ? '' : 'justify-center'">
        <v-tooltip text="Mark all notifications as read" location="top" v-if="!xs">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              :disabled="notificationsStore.unreadCount === 0"
              :class="xs ? '' : 'px-8'"
              class="text-none"
              color="red-darken-2"
              variant="tonal"
              rounded="pill"
              size="large"
              append-icon="mdi-check-all"
              @click="notificationsStore.markAllAsRead()"
            >
              Mark all as read
            </v-btn>
          </template>
        </v-tooltip>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
