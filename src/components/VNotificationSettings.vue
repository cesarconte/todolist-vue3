<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useDisplay } from 'vuetify'

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
const isLoading = ref(false) // Controls the loading state of the component
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
  notificationsStore.notificationSettings.enabled ? 'red-darken-2' : 'grey-darken-1'
) // Sets the color of the notification switch
const isDisabled = computed(
  () => isLoading.value || !notificationsStore.hasFullSupport || !userStore.isLoggedIn
) // Determines if the notification switch should be disabled

/************************************
 * Lifecycle Hooks
 ************************************/
onMounted(async () => {
  // Executes when the component is mounted
  if (!userStore.isLoggedIn) {
    emit('update:modelValue', false)
    return
  }

  try {
    isLoading.value = true // Sets loading state to true
    await notificationsStore.loadSettings() // Loads notification settings from the store
  } catch (error) {
    handleError('Error loading settings', error) // Handles any errors that occur during loading
  } finally {
    isLoading.value = false // Sets loading state to false
  }
})

/************************************
 * Watchers
 ************************************/
watch(
  () => notificationsStore.notificationSettings,
  async (newSettings) => {
    // Watches for changes in the notification settings
    if (!userStore.isLoggedIn) {
      // Checks if the user is logged in
      notificationsStore.showSnackbar = {
        show: true,
        message: 'Authentication required to modify settings'
      }
      return
    }

    try {
      isLoading.value = true // Sets loading state to true
      saveError.value = null // Resets the save error
      await notificationsStore.saveSettings() // Saves the notification settings to the store

      if (newSettings.enabled) {
        // Checks if notifications are enabled
        const verified = await verifyNotifications() // Verifies notification permissions
        if (!verified) {
          // Disables notifications if permissions are not granted
          notificationsStore.notificationSettings.enabled = false
        }
      }
    } catch (error) {
      handleError('Error saving settings', error) // Handles any errors that occur during saving
    } finally {
      isLoading.value = false // Sets loading state to false
    }
  },
  { deep: true }
)

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
  notificationsStore.showSnackbar = {
    show: true,
    message: message
  }
}

const closeDialog = () => {
  // Closes the dialog by emitting the update:modelValue event
  emit('update:modelValue', false)
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
    max-width="600px"
    class="dialog dialog-notifications-settings"
  >
    <v-card class="notification-settings-card pa-4 rounded-lg elevation-4 d-flex flex-column">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Notifications Settings</span>
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
        <v-btn icon @click="closeDialog" variant="text" color="grey-darken-1">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider class="my-4" />

      <v-card-text class="pa-0">
        <v-container v-if="isLoading" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" size="24" />
          <span class="text-caption mt-2">Saving settings...</span>
        </v-container>

        <template v-else>
          <v-alert v-if="saveError" type="error" density="compact" class="mb-4">
            {{ saveError }}
          </v-alert>

          <v-alert v-if="!hasFullSupport" type="warning" density="compact" class="mb-4">
            <template v-slot:title> Limited Browser Support </template>
            Some notification features are not available in your current browser.
          </v-alert>

          <v-card-item class="pt-0">
            <v-switch
              v-model="notificationsStore.notificationSettings.enabled"
              :label="switchLabel"
              :color="switchColor"
              :disabled="isDisabled"
              inset
              hide-details
            >
            </v-switch>
          </v-card-item>

          <v-card-item>
            <v-select
              v-model="notificationsStore.notificationSettings.time"
              :items="notificationTimeOptions"
              item-value="value"
              item-title="title"
              label="Notification Times"
              variant="outlined"
              :color="switchColor"
              :disabled="!notificationsStore.notificationSettings.enabled || isDisabled"
              multiple
              clearable
              chips
              closable-chips
              hide-details
              class="mt-4"
            >
              <template v-slot:selection="{ item, index }">
                <v-chip v-if="index < 2" :color="switchColor" class="ma-1" label size="small">
                  {{ item.title }}
                </v-chip>
                <span v-if="index === 2" class="text-grey text-caption ml-1">
                  +{{ notificationsStore.notificationSettings.time.length - 2 }} more
                </span>
              </template>
            </v-select>
          </v-card-item>

          <v-card-item class="mb-2">
            <v-row class="text-caption">
              <v-col cols="auto" class="d-flex align-center">
                <v-icon icon="mdi-clock-outline" class="mr-2" />
                Next check: {{ notificationsStore.nextScheduledCheck || 'Not scheduled' }}
              </v-col>
            </v-row>
          </v-card-item>
        </template>
      </v-card-text>

      <v-divider class="mb-4" />

      <v-card-actions :class="xs ? '' : 'justify-center'">
        <v-tooltip text="Send test notification" location="top" v-if="!xs">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              :block="xs"
              :disabled="isDisabled"
              :class="xs ? '' : 'px-8'"
              class="text-none"
              color="red-darken-2"
              variant="tonal"
              rounded="pill"
              size="large"
              append-icon="mdi-bell-alert-outline"
              @click="notificationsStore.sendTestNotification()"
            >
              Test Notification
            </v-btn>
          </template>
        </v-tooltip>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
:deep(.v-chip--selected) {
  border: 1px solid currentColor;
}

:deep(.v-field--disabled) {
  opacity: 0.6;
}
</style>
