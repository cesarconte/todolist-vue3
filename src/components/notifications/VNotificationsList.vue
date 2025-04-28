<script setup>
import { useNotificationsStore } from '@/stores/notificationsStore'
// import { useDisplay } from 'vuetify'
import { formatDate } from '@/utils/date/dateFormat'
import VEmptyState from '@/components/tasks/VEmptyState.vue'

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
// const { xs } = useDisplay() // Accesses display breakpoints from Vuetify
</script>

<template>
  <v-dialog
    :model-value="props.modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    max-width="600px"
    class="dialog-notifications-list"
  >
    <v-card class="notification-list-card pa-4 rounded-lg elevation-2" color="surface">
      <v-card-title class="d-flex align-center justify-space-between mb-2">
        <span class="text-h6 text-on-surface font-weight-medium">Notifications</span>
        <v-btn icon @click="closeDialog" variant="text" color="on-surface-variant">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-subtitle class="text-on-surface-variant pb-2">
        <v-icon icon="mdi-bell-badge" size="small" class="mr-1"></v-icon>
        You have {{ notificationsStore.unreadCount }} unread notifications
      </v-card-subtitle>

      <v-divider class="my-4" />

      <v-card-text class="px-0 pt-0 pb-4">
        <v-list density="comfortable" class="notification-list" bg-color="transparent">
          <template v-if="notificationsStore.activeNotifications.length > 0">
            <v-list-item
              v-for="item in notificationsStore.activeNotifications"
              :key="item.id"
              rounded="lg"
              class="mb-4"
              :bg-color="item.read ? 'surface-variant' : 'primary-container'"
            >
              <template v-slot:prepend>
                <v-checkbox
                  :model-value="item.read"
                  @click.stop="handleCheckboxChange(item)"
                  color="primary"
                  hide-details
                  density="compact"
                  class="mt-0 pt-0"
                />
              </template>

              <template v-slot:default>
                <v-row align="center">
                  <v-icon
                    :icon="item.icon"
                    :color="item.read ? 'on-surface-variant' : 'primary'"
                    class="ml-4"
                    size="large"
                  />
                  <v-col>
                    <v-list-item-title
                      lines="one"
                      class="text-body-1 font-weight-medium mb-2"
                      :class="item.read ? 'text-on-surface-variant' : 'text-on-primary-container'"
                    >
                      {{ item.message }}
                    </v-list-item-title>
                    <v-list-item-subtitle
                      lines="one"
                      class="mb-2"
                      :class="item.read ? 'text-on-surface-variant' : ''"
                    >
                      {{ formatDate(item.timestamp) }}
                    </v-list-item-subtitle>
                  </v-col>
                </v-row>
              </template>
            </v-list-item>
          </template>
          <template v-else>
            <v-container class="empty-state-container">
              <VEmptyState
                icon="mdi-checkbox-marked-circle-auto-outline"
                :icon-size="96"
                icon-color="on-surface-variant"
                title="All caught up!"
                subtitle="No new notifications"
                text-color="text-on-surface-variant"
              >
                <p class="text-caption text-on-surface-variant mt-2">
                  Check back later for new notifications
                </p>
              </VEmptyState>
            </v-container>
          </template>
        </v-list>
      </v-card-text>

      <v-divider class="mb-4" />

      <v-card-actions class="justify-end px-4 pb-0">
        <v-tooltip text="Mark all notifications as read" location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              :disabled="notificationsStore.unreadCount === 0"
              color="primary"
              variant="elevated"
              rounded
              size="large"
              prepend-icon="mdi-check-all"
              class="text-none"
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
