<script setup>
import { computed, ref } from 'vue'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useDisplay } from 'vuetify'
import { showSnackbar } from '@/utils/notifications/notificationHelpers.js'

/************************************
 * Props & Emits
 ************************************/
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

/************************************
 * Reactive Variables (refs)
 ************************************/
const saveError = ref(null) // Stores any error messages that occur during saving
const browserSupport = ref({
  notifications: 'Notification' in window,
  serviceWorker: 'serviceWorker' in navigator,
  pushManager: 'PushManager' in window
}) // Checks browser support for notification features

/************************************
 * Stores
 ************************************/
const notificationsStore = useNotificationsStore() // Accesses the notifications store
const userStore = useUserStore() // Accesses the user store

/************************************
 * Computed Properties
 ************************************/
const showNotificationsSettings = computed(() => props.modelValue) // Controls the dialog's visibility based on the prop
const hasFullSupport = computed(() => Object.values(browserSupport.value).every(Boolean)) // Checks if all required browser features are supported
const switchLabel = computed(() =>
  notificationsStore.notificationSettings.enabled
    ? 'Notifications enabled'
    : 'Notifications disabled'
) // Sets the label for the notification switch
const switchColor = computed(() =>
  notificationsStore.notificationSettings.enabled ? 'primary' : 'on-surface-variant'
) // Sets the color of the notification switch using semantic MD3 colors
const isDisabled = computed(() => !notificationsStore.hasFullSupport || !userStore.isLoggedIn) // Determines if the notification switch should be disabled

/************************************
 * Methods / Functions
 ************************************/
const verifyNotifications = async () => {
  // Verifies browser notification permissions
  try {
    if (!('Notification' in window)) {
      throw new Error('Browser does not support notifications')
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notifications are blocked by browser settings')
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Permission not granted')
      }
    }

    return true
  } catch (error) {
    handleError(error.message, error)
    return false
  }
}

const handleError = (message, error) => {
  // Handles errors and displays snackbar messages
  saveError.value = message
  console.error('Notification Settings Error:', error)
  showSnackbar(notificationsStore, message, 'error', 'mdi-alert-circle')
}

const closeDialog = () => {
  // Closes the dialog by emitting the update:modelValue event
  emit('update:modelValue', false)
}

const handleSwitchChange = async (enabled) => {
  if (!userStore.isLoggedIn) {
    showSnackbar(
      notificationsStore,
      'Authentication required to modify settings',
      'error',
      'mdi-alert-circle'
    )
    notificationsStore.notificationSettings.enabled = false // Revert the switch
    return
  }

  try {
    if (enabled) {
      const verified = await verifyNotifications()
      if (!verified) {
        notificationsStore.notificationSettings.enabled = false // Revert the switch
        return
      }
    }
    // Explicitly set the enabled value before saving
    notificationsStore.notificationSettings.enabled = enabled
    await notificationsStore.saveSettings()
    const message = enabled
      ? 'Notifications enabled successfully'
      : 'Notifications disabled successfully'
    const color = enabled ? 'success' : 'info'
    const icon = enabled ? 'mdi-check-circle' : 'mdi-bell-off-outline'
    showSnackbar(notificationsStore, message, color, icon)
  } catch (error) {
    handleError('Error updating settings', error)
    notificationsStore.notificationSettings.enabled = !enabled // Revert the switch on error
    showSnackbar(notificationsStore, 'Error updating settings', 'error', 'mdi-alert-circle')
  }
}

const notificationTimeOptions = [
  // Options for notification time selections
  { title: '1 day before', value: 24 },
  { title: '12 hours before', value: 12 },
  { title: '6 hours before', value: 6 },
  { title: '3 hours before', value: 3 },
  { title: '2 hours before', value: 2 },
  { title: '1 hour before', value: 1 },
  { title: '45 minutes before', value: 0.75 },
  { title: '30 minutes before', value: 0.5 },
  { title: '15 minutes before', value: 0.25 }
]

const { xs } = useDisplay() // Accesses display breakpoints from Vuetify
</script>

<template>
  <v-dialog
    v-model="showNotificationsSettings"
    :max-width="xs ? 'calc(100vw - 32px)' : '37.5rem'"
    :width="xs ? undefined : undefined"
    class="dialog dialog-notifications-settings"
  >
    <v-card
      class="notification-settings-card rounded-lg elevation-2 d-flex flex-column"
      color="surface"
      density="comfortable"
    >
      <v-card-title
        :class="
          xs
            ? 'd-flex align-center justify-space-between px-2 py-3'
            : 'd-flex align-center justify-space-between px-6 py-4'
        "
      >
        <span class="text-h6 text-on-surface font-weight-medium">Notifications Settings</span>
        <v-tooltip v-if="!hasFullSupport" location="right">
          <template v-slot:activator="{ props }">
            <v-icon
              v-bind="props"
              icon="mdi-alert"
              color="warning"
              class="ml-4"
              aria-label="Browser Support Warning"
            ></v-icon>
          </template>
          <span class="text-caption pr-4">
            Browser notification features:
            <span
              v-for="(value, key) in browserSupport"
              :key="key"
              :class="value ? 'text-success' : 'text-error'"
              class="d-flex align-center justify-end"
            >
              >
              {{ key }}: {{ value ? '✓' : '✗' }}
            </span>
          </span>
        </v-tooltip>
        <v-btn icon @click="closeDialog" variant="text" color="on-surface-variant">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-subtitle :class="xs ? 'px-2 py-3' : 'px-6 py-4'">
        <v-icon icon="mdi-bell-cog" size="small" class="mr-1"></v-icon>
        Configure when you want to receive notifications
      </v-card-subtitle>

      <v-divider class="my-6" />

      <v-card-text :class="xs ? 'px-2 pt-0 pb-2' : 'px-6 pt-0 pb-2'">
        <v-alert
          v-if="!userStore.isLoggedIn"
          type="warning"
          density="compact"
          variant="tonal"
          rounded="lg"
          border="start"
          class="mb-6"
          icon="mdi-account-alert"
        >
          <template v-slot:title>Sign in required</template>
          You must be logged in to modify your notification settings.
        </v-alert>

        <v-alert
          v-if="saveError"
          type="error"
          density="compact"
          variant="tonal"
          border="start"
          class="mb-6"
        >
          {{ saveError }}
        </v-alert>

        <v-alert
          v-if="!hasFullSupport"
          type="warning"
          density="compact"
          variant="tonal"
          border="start"
          class="mb-6"
        >
          <template v-slot:title> Limited Browser Support </template>
          Some notification features are not available in your current browser.
        </v-alert>

        <v-card-item :class="xs ? 'px-0 mb-6' : 'px-0 mb-6'">
          <v-tooltip
            :text="
              notificationsStore.notificationSettings.enabled
                ? 'Disable notifications'
                : 'Enable notifications'
            "
            location="top"
          >
            <template v-slot:activator="{ props }">
              <v-switch
                v-bind="props"
                v-model="notificationsStore.notificationSettings.enabled"
                :label="switchLabel"
                :color="switchColor"
                :disabled="isDisabled"
                inset
                hide-details
                density="comfortable"
                class="mb-2"
                @update:model-value="handleSwitchChange"
              >
              </v-switch>
            </template>
          </v-tooltip>
        </v-card-item>

        <v-card-item
          :class="
            xs
              ? 'd-flex flex-column align-stretch px-0 mb-6'
              : 'd-flex flex-column align-stretch px-0 mb-6'
          "
        >
          <v-select
            v-model="notificationsStore.notificationSettings.time"
            :items="notificationTimeOptions"
            item-value="value"
            item-title="title"
            label="Notification Times"
            variant="outlined"
            bg-color="surface-container"
            :color="
              notificationsStore.notificationSettings.enabled ? 'primary' : 'on-surface-variant'
            "
            :disabled="!notificationsStore.notificationSettings.enabled || isDisabled"
            multiple
            clearable
            chips
            closable-chips
            hide-details
            rounded
            class="mt-2"
            density="comfortable"
          >
            <template v-slot:selection="{ item, index }">
              <v-chip
                v-if="index < 2"
                :color="
                  notificationsStore.notificationSettings.enabled ? 'primary' : 'on-surface-variant'
                "
                class="ma-1"
                label
                size="small"
                variant="tonal"
              >
                {{ item.title }}
              </v-chip>
              <span v-if="index === 2" class="text-on-surface-variant text-caption ml-1">
                +{{ notificationsStore.notificationSettings.time.length - 2 }} more
              </span>
            </template>
          </v-select>
        </v-card-item>

        <v-card-item :class="xs ? 'px-0 mb-6' : 'px-0 mb-6'">
          <v-row class="text-caption">
            <v-col cols="auto" class="d-flex align-center">
              <v-icon icon="mdi-clock-outline" class="mr-1" size="small" />
              <span class="text-on-surface-variant">
                Next check: {{ notificationsStore.nextScheduledCheck || 'Not scheduled' }}
              </span>
            </v-col>
          </v-row>
        </v-card-item>
      </v-card-text>

      <v-divider class="my-6" />

      <v-card-actions
        :class="xs ? 'justify-end px-2 pb-3' : 'justify-end px-6 pb-4'"
      >
        <v-btn
          :disabled="isDisabled || !notificationsStore.notificationSettings.enabled"
          color="surface-variant"
          variant="tonal"
          rounded
          size="large"
          prepend-icon="mdi-bell-alert-outline"
          class="text-none text-button"
          :block="xs"
          @click="notificationsStore.sendTestNotification()"
        >
          Test Notification
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
