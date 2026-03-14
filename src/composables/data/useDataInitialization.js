import { watch } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useProjectStore } from '@/stores/projectStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useUserStore } from '@/stores/userStore'
import { showSnackbar } from '@/utils/notifications/notificationHelpers.js'

export function useDataInitialization() {
  const taskStore = useTaskStore()
  const projectStore = useProjectStore()
  const notificationsStore = useNotificationsStore()
  const userStore = useUserStore()

  // Function to handle errors consistently
  const handleError = (error, message = 'An error occurred') => {
    console.error(error)
    showSnackbar(notificationsStore, message, 'error', 'mdi-alert-circle')
  }

  // Function to initialize tasks and projects
  const initializeData = async () => {
    if (!userStore.userId) {
      return
    }
    try {
      taskStore.subscribeToTasks()
      projectStore.subscribeToCollection()
    } catch (error) {
      handleError(error, 'Failed to initialize data')
    }
  }

  // Cleanup function to unsubscribe listeners stored in the stores
  const cleanup = () => {
    try {
      // Unsubscribe from taskStore listeners
      if (taskStore.listeners && typeof taskStore.listeners === 'object') {
        Object.keys(taskStore.listeners).forEach((key) => {
          const unsubscribeFn = taskStore.listeners[key]
          if (typeof unsubscribeFn === 'function') {
            try {
              unsubscribeFn()
            } catch (err) {
              console.warn(
                `[useDataInitialization] Error unsubscribing taskStore listener '${key}':`,
                err
              )
            }
            taskStore.listeners[key] = null
          }
        })
      }

      // Unsubscribe from projectStore listeners
      if (projectStore.listeners && typeof projectStore.listeners === 'object') {
        Object.keys(projectStore.listeners).forEach((key) => {
          const unsubscribeFn = projectStore.listeners[key]
          if (typeof unsubscribeFn === 'function') {
            try {
              unsubscribeFn()
            } catch (err) {
              console.warn(
                `[useDataInitialization] Error unsubscribing projectStore listener '${key}':`,
                err
              )
            }
            projectStore.listeners[key] = null
          }
        })
      }
    } catch (error) {
      console.error('[useDataInitialization] Error during cleanup:', error)
    }
  }

  // Watch for authentication state changes
  watch(
    () => userStore.isLoggedIn,
    (isLoggedIn) => {
      if (isLoggedIn) {
        initializeData()
      } else {
        cleanup()
      }
    },
    { immediate: true }
  )

  return {
    initializeData,
    handleError
  }
}
