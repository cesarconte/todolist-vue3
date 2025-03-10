<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import { useUserStore } from '@/stores/userStore.js'

// Variables
const notificationsStore = useNotificationsStore()
const userStore = useUserStore()
const isLoading = ref(false)
const saveError = ref(null)
const emit = defineEmits(['close'])

// const selectedItems = ref([])

const browserSupport = ref({
  notifications: 'Notification' in window,
  serviceWorker: 'serviceWorker' in navigator,
  pushManager: 'PushManager' in window
})

// Computed properties
const hasFullSupport = computed(() => Object.values(browserSupport.value).every(Boolean))

const switchLabel = computed(() =>
  notificationsStore.notificationSettings.enabled
    ? 'Notifications enabled'
    : 'Notifications disabled'
)

const switchColor = computed(() =>
  notificationsStore.notificationSettings.enabled ? 'red-darken-2' : 'grey-darken-1'
)

const isDisabled = computed(
  () => isLoading.value || !notificationsStore.hasFullSupport || !userStore.isLoggedIn // Añadida verificación de autenticación
)

// Verificación inicial de autenticación y carga de configuraciones de notificación
onMounted(async () => {
  if (!userStore.isLoggedIn) {
    notificationsStore.showSnackbar = {
      show: true,
      message: 'You must be logged in to access notification settings'
    }
    emit('close') // Cierra automáticamente el diálogo si no está autenticado
  } else {
    try {
      isLoading.value = true
      await notificationsStore.loadSettings()
    } catch (error) {
      handleError('Error loading settings', error)
    } finally {
      isLoading.value = false
    }
  }
})

// Watcher para guardar cambios cuando se modifica la configuración
watch(
  () => notificationsStore.notificationSettings,
  async (newSettings) => {
    if (!userStore.isLoggedIn) {
      notificationsStore.showSnackbar = {
        show: true,
        message: 'Authentication required to modify settings'
      }
      return
    }

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
  <v-card class="notification-settings-card pa-4 rounded-lg elevation-4 d-flex flex-column">
    <v-card-title class="d-flex align-center">
      <span>Notifications</span>
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

        <!-- <v-divider class="mb-4" /> -->

        <!-- <v-card-item v-if="notificationsStore.notificationSettings.enabled">
          <v-treeview
            v-model:selected="selectedItems"
            :items="userStore.user.notifications"
            :item-props="itemProps"
            class="notification-tree mb-4"
            return-object
            selectable
            activatable
            selected-color="red-accent-1"
          >
          </v-treeview> 
        </v-card-item> -->
      </template>
    </v-card-text>

    <v-divider class="mb-4" />

    <v-card-actions class="d-flex flex-column align-center ga-4">
      <v-btn
        class="text-none rounded-pill"
        color="secondary"
        variant="tonal"
        size="large"
        :disabled="isDisabled"
        block
        @click="notificationsStore.sendTestNotification()"
      >
        <v-icon left icon="mdi-bell-outline" class="mr-2" />
        Test Notification
      </v-btn>

      <v-btn
        class="text-none rounded-pill ml-0"
        color="red-darken-2"
        variant="tonal"
        size="large"
        @click="$emit('close')"
        :disabled="isLoading"
        block
      >
        <v-icon left icon="mdi-close" class="mr-2" />
        Close Settings
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
:deep(.v-chip--selected) {
  border: 1px solid currentColor;
}

:deep(.v-field--disabled) {
  opacity: 0.6;
}
</style>
