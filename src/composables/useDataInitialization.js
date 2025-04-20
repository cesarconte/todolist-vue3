import { watch } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useProjectStore } from '@/stores/projectStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useUserStore } from '@/stores/userStore'
import { showSnackbar } from '@/utils/notificationHelpers.js' // Import the helper

export function useDataInitialization() {
  const taskStore = useTaskStore()
  const projectStore = useProjectStore()
  const notificationsStore = useNotificationsStore()
  const userStore = useUserStore()

  // Function to handle errors consistently
  const handleError = (error, message = 'An error occurred') => {
    console.error(error)
    showSnackbar(notificationsStore, message, 'error', 'mdi-alert-circle') // Use the centralized helper function
  }

  // Function to initialize tasks and projects
  const initializeData = async () => {
    if (!userStore.userId) {
      console.log('[useDataInitialization] Waiting for user authentication...')
      return
    }
    console.log('[useDataInitialization] User authenticated, initializing data...')
    try {
      taskStore.subscribeToTasks() // Sincronización en tiempo real de tareas
      projectStore.subscribeToCollection() // Sincronización en tiempo real de proyectos
    } catch (error) {
      handleError(error, 'Failed to initialize data')
    }
  }

  // Cleanup function to unsubscribe listeners stored in the stores
  const cleanup = () => {
    try {
      console.log('[useDataInitialization] Cleaning up listeners...')

      // Unsubscribe from taskStore listeners
      if (taskStore.listeners && typeof taskStore.listeners === 'object') {
        Object.keys(taskStore.listeners).forEach((key) => {
          const unsubscribeFn = taskStore.listeners[key]
          if (typeof unsubscribeFn === 'function') {
            try {
              console.log(`[useDataInitialization] Unsubscribing from taskStore listener: ${key}`)
              unsubscribeFn()
            } catch (err) {
              console.warn(
                `[useDataInitialization] Error unsubscribing taskStore listener '${key}':`,
                err
              )
            }
            // Ensure the store nullifies the listener reference as well
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
              console.log(
                `[useDataInitialization] Unsubscribing from projectStore listener: ${key}`
              )
              unsubscribeFn()
            } catch (err) {
              console.warn(
                `[useDataInitialization] Error unsubscribing projectStore listener '${key}':`,
                err
              )
            }
            // Ensure the store nullifies the listener reference as well
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
        cleanup() // Now only unsubscribes listeners
      }
    },
    { immediate: true } // Ejecuta inmediatamente al montar
  )

  return {
    initializeData, // Exponer si se necesita llamar manualmente
    handleError
  }
}
