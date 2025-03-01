<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notificationsStore.js'

const notificationsStore = useNotificationsStore()
const isLoading = ref(false)
const saveError = ref(null)
const browserSupport = ref({
  notifications: 'Notification' in window,
  serviceWorker: 'serviceWorker' in navigator,
  pushManager: 'PushManager' in window
})

// Computed properties
const hasFullSupport = computed(() => 
  Object.values(browserSupport.value).every(Boolean)
)

const switchLabel = computed(() => 
  notificationsStore.notificationSettings.enabled 
    ? 'Notifications enabled' 
    : 'Notifications disabled'
)

const switchColor = computed(() => 
  notificationsStore.notificationSettings.enabled 
    ? 'red-darken-2' 
    : 'grey-darken-1'
)

const isDisabled = computed(() => 
  isLoading.value || !hasFullSupport.value
)

// Cargar configuraciones iniciales
onMounted(async () => {
  try {
    isLoading.value = true
    await notificationsStore.loadSettings()
  } catch (error) {
    handleError('Error loading settings', error)
  } finally {
    isLoading.value = false
  }
})

// Watcher para guardar cambios
watch(
  () => notificationsStore.notificationSettings,
  async (newSettings) => {
    try {
      isLoading.value = true
      saveError.value = null
      
      await notificationsStore.saveSettings()
      
      if (newSettings.enabled) {
        const verified = await verifyNotifications()
        if (!verified) {
          notificationsStore.notificationSettings.enabled = false
        }
      }
    } catch (error) {
      handleError('Error saving settings', error)
    } finally {
      isLoading.value = false
    }
  },
  { deep: true }
)

// Métodos
const verifyNotifications = async () => {
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
  saveError.value = message
  console.error('Notification Settings Error:', error)
  notificationsStore.showSnackbar = {
    show: true,
    message: message
  }
}

const notificationTimeOptions = [
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
</script>

<template>
  <v-card class="notification-settings-card pa-4">
    <v-card-title class="d-flex align-center">
      <span>Notification Settings</span>
      <v-tooltip v-if="!hasFullSupport" location="right">
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props" color="warning" class="ml-2">mdi-alert</v-icon>
        </template>
        <span class="text-caption">
          Browser notification features: 
          <span v-for="(value, key) in browserSupport" :key="key" 
                :class="value ? 'text-success' : 'text-error'">
            {{ key }}: {{ value ? '✓' : '✗' }}
          </span>
        </span>
      </v-tooltip>
    </v-card-title>

    <v-divider class="my-4" />

    <v-card-text>
      <div v-if="isLoading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="24" />
        <div class="text-caption mt-2">Saving settings...</div>
      </div>

      <template v-else>
        <v-alert v-if="saveError" type="error" density="compact" class="mb-4">
          {{ saveError }}
        </v-alert>

        <v-alert v-if="!hasFullSupport" type="warning" density="compact" class="mb-4">
          <template v-slot:title>
            Limited Browser Support
          </template>
          Some notification features are not available in your current browser.
        </v-alert>

        <v-switch
          v-model="notificationsStore.notificationSettings.enabled"
          :label="switchLabel"
          :color="switchColor"
          :disabled="isDisabled"
          inset
          hide-details
          class="mb-4"
        >
          <template v-slot:append>
            <v-icon
              :color="notificationsStore.notificationSettings.enabled ? 'success' : 'error'"
              size="24"
            >
              {{ notificationsStore.notificationSettings.enabled 
                 ? 'mdi-check-circle' 
                 : 'mdi-close-circle' }}
            </v-icon>
          </template>
        </v-switch>

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
        >
          <template v-slot:selection="{ item, index }">
            <v-chip
              v-if="index < 2"
              :color="switchColor"
              class="ma-1"
              label
              size="small"
            >
              {{ item.title }}
            </v-chip>
            <span
              v-if="index === 2"
              class="text-grey text-caption ml-1"
            >
              +{{ notificationsStore.notificationSettings.time.length - 2 }} more
            </span>
          </template>
        </v-select>

        <div v-if="notificationsStore.notificationSettings.enabled" class="mt-6">
          <v-divider class="mb-4" />

          <div class="d-flex align-center justify-space-between">
            <div class="text-caption text-medium-emphasis">
              <v-icon icon="mdi-clock-outline" size="16" class="mr-1" />
              Next check: {{ notificationsStore.nextScheduledCheck || 'Not scheduled' }}
            </div>

            <v-btn
              color="secondary"
              variant="tonal"
              size="small"
              :disabled="isDisabled"
              @click="notificationsStore.sendTestNotification()"
            >
              <v-icon left icon="mdi-bell-ring-outline" size="18" />
              Test Notification
            </v-btn>
          </div>
        </div>
      </template>
    </v-card-text>

    <v-card-actions class="px-4 pb-4">
      <v-btn
        color="red-darken-2"
        variant="flat"
        rounded="lg"
        @click="$emit('close')"
        :disabled="isLoading"
        block
      >
        <v-icon left icon="mdi-close" />
        Close Settings
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.notification-settings-card {
  max-width: 500px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.v-chip--selected) {
  border: 1px solid currentColor;
}

:deep(.v-field--disabled) {
  opacity: 0.6;
}
</style>