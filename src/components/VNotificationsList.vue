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
      <v-card-title class="d-flex align-center justify-space-between text-h5">
        <span class="text-red-darken-2 font-weight-medium">Notification List</span>
        <v-btn icon @click="closeDialog" variant="text" color="grey-darken-1">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-subtitle>
        <v-icon icon="mdi-bell-badge"></v-icon>
        Unread notifications: mark as read to clear
      </v-card-subtitle>

      <v-divider class="my-4" />

      <v-card-text class="pa-0">
        <v-list density="comfortable" class="notification-list">
          <template v-if="notificationsStore.activeNotifications.length > 0">
            <v-list-item
              v-for="item in notificationsStore.activeNotifications"
              :key="item.id"
              rounded="pill"
              class="mb-2 bg-grey-lighten-4"
            >
              <template v-slot:prepend>
                <v-checkbox
                  :model-value="item.read"
                  @click.stop="handleCheckboxChange(item)"
                  color="red-accent-2"
                  hide-details
                  density="compact"
                  class="mt-0 pt-0"
                />
              </template>

              <template v-slot:default>
                <v-row align="center">
                  <v-icon :icon="item.icon" color="red-accent-2" class="ml-3" size="large" />
                  <v-col>
                    <v-list-item-title lines="one" class="text-body-1 font-weight-medium">
                      {{ item.message }}
                    </v-list-item-title>
                    <v-list-item-subtitle lines="one">{{
                      formatDate(item.timestamp)
                    }}</v-list-item-subtitle>
                  </v-col>
                </v-row>
              </template>
            </v-list-item>
          </template>
          <template v-else>
            <v-container class="empty-state-container">
              <v-list-item class="d-flex justify-center">
                <v-col class="d-flex flex-column align-center">
                  <v-icon
                    icon="mdi-checkbox-marked-circle-auto-outline"
                    size="96"
                    color="grey-lighten-1"
                    class="mb-4 d-flex flex-center empty-icon"
                  />
                  <v-list-item-title
                    class="text-center text-h5 font-weight-medium text-grey-lighten-1 mb-2"
                  >
                    All caught up!</v-list-item-title
                  >
                  <v-list-item-subtitle
                    class="text-center text-subtitle-1 text-grey-lighten-1 mb-1"
                  >
                    No new notifications
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="text-center text-subtitle-2 text-grey-lighten-1">
                    Check back later for new notifications
                  </v-list-item-subtitle>
                </v-col>
              </v-list-item>
            </v-container>
          </template>
        </v-list>
      </v-card-text>

      <v-card-actions :class="xs ? 'w-100' : 'justify-center'">
        <v-tooltip text="Mark all notifications as read" location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              :disabled="notificationsStore.unreadCount === 0"
              :class="xs ? '' : 'px-8'"
              :block="xs"
              class="text-none text-button"
              color="red-accent-2"
              variant="tonal"
              rounded="pill"
              size="large"
              prepend-icon="mdi-check-all"
              @click="notificationsStore.markAllAsRead()"
            >
              <template v-slot:loader>
                <v-progress-circular indeterminate size="20" width="2" />
              </template>
              Mark all as read
            </v-btn>
          </template>
        </v-tooltip>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.empty-state-container {
  transition: all 0.3s ease;
}

.empty-icon {
  opacity: 0.8;
  transform: translateY(-5px);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(-5px);
  }
  50% {
    transform: translateY(5px);
  }
}

.v-list-item-title {
  letter-spacing: 0.5px !important;
}

.v-list-item-subtitle {
  max-width: 400px;
}
</style>
