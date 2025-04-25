import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { doc, updateDoc, getDocs, query, where, onSnapshot, collection } from 'firebase/firestore'
import { useUserStore } from '@/stores/userStore'
// import { useDataStore } from '@/stores/dataStore'
import { useTaskStore } from '@/stores/taskStore'
import {
  getDocument,
  getCollection,
  addDocument,
  deleteDocument
} from '@/utils/firestore/firestoreCrud.js'
import { mapFirestoreNotification } from '@/utils/notifications/notificationMappers.js'
import {
  showSnackbar,
  handleError,
  requireUserId
} from '@/utils/notifications/notificationHelpers.js'
import { buildNotificationQuery } from '@/utils/notifications/notificationQueries.js'
import { batchDeleteDocuments } from '@/utils/firestore/firestoreBatch.js'

/**
 * Notification Store - Manages all notification-related functionality
 * Handles user settings, browser permissions, scheduling, and display
 */
export const useNotificationsStore = defineStore('notifications', {
  // State management for notifications
  state: () => ({
    // User notification preferences
    notificationSettings: {
      enabled: false, // Global toggle for notifications
      time: [] // Array of notification times before task due (in hours)
    },

    // Active in-app notifications to display
    activeNotifications: [], // Array of {id, message, show, timestamp}

    // Scheduled timeout references for notifications
    timeouts: [], // Array of {id: timeoutID, scheduledTime: timestamp, taskId}

    // Snackbar/toast notification system
    showSnackbar: {
      show: false, // Visibility state
      message: '', // Display message
      prependIcon: '', // Icon to display
      appendIcon: '', // Icon to display
      color: 'success' // Color theme for notification
    },

    // Browser capability detection
    browserSupport: {
      notifications: 'Notification' in window, // HTML5 Notification API support
      serviceWorker: 'serviceWorker' in navigator, // Service Worker registration
      pushManager: 'PushManager' in window // Push API support
    },

    unsubscribeNotifications: null // Para la suscripción en tiempo real
  }),

  // Computed properties derived from state
  getters: {
    /**
     * Gets formatted string of next scheduled notification time
     * @returns {string} Human-readable date string or default message
     */
    nextScheduledCheck: (state) => {
      if (state.timeouts.length === 0) return 'No scheduled notifications'
      const nextTime = Math.min(...state.timeouts.map((t) => t.scheduledTime))
      return new Date(nextTime).toLocaleString()
    },

    /**
     * Checks if browser supports all required notification features
     * @returns {boolean} True if all features are supported
     */
    hasFullSupport: (state) => {
      return Object.values(state.browserSupport).every(Boolean)
    },

    unreadCount: (state) => state.activeNotifications.filter((n) => !n.read).length
  },

  // Business logic and async operations
  actions: {
    /**
     * Loads user notification settings from Firestore
     * Automatically schedules notifications if enabled
     */
    async loadSettings() {
      const userStore = useUserStore()
      try {
        const userId = requireUserId(userStore)

        // Fetch user document from Firestore
        const userDoc = await getDocument(doc(db, 'users', userId))
        if (userDoc) {
          const data = userDoc
          if (data.notificationSettings) {
            // Update local state with stored settings
            this.notificationSettings = data.notificationSettings

            // Schedule notifications if enabled
            if (this.notificationSettings.enabled) {
              const taskStore = useTaskStore()
              this.scheduleNotifications(taskStore.tasksData)
            }
          }
        }

        // Suscribirse a notificaciones en tiempo real
        this.subscribeToNotifications()
      } catch (error) {
        handleError(this, 'Error loading settings', error)
      }
    },

    async subscribeToNotifications({ unreadOnly = true, pageSize, lastVisible, order } = {}) {
      const userStore = useUserStore()
      if (this.unsubscribeNotifications) return

      try {
        const userId = requireUserId(userStore)
        const q = buildNotificationQuery(userId, { unreadOnly, pageSize, lastVisible, order })

        this.unsubscribeNotifications = onSnapshot(q, (snapshot) => {
          // Forzar una actualización reactiva
          this.activeNotifications = snapshot.docs.map(mapFirestoreNotification)
        })
      } catch (error) {
        handleError(this, 'Error subscribing to notifications', error)
      }
    },

    /**
     * Saves current notification settings to Firestore
     * Re-schedules notifications with updated settings
     */
    async saveSettings(showSuccess = false) {
      const userStore = useUserStore()
      try {
        const userId = requireUserId(userStore)

        // Update Firestore document with current settings
        await updateDoc(doc(db, 'users', userId), {
          notificationSettings: this.notificationSettings
        })

        // Clear existing timeouts and reschedule
        this.clearTimeouts()
        if (this.notificationSettings.enabled) {
          const taskStore = useTaskStore()
          this.scheduleNotifications(taskStore.tasksData)
        }

        if (showSuccess) {
          showSnackbar(this, 'Settings saved!', 'success', 'mdi-content-save')
        }
      } catch (error) {
        handleError(this, 'Error saving settings', error)
        throw error
      }
    },

    /**
     * Verifies browser notification support and permissions
     * @returns {Promise<boolean>} True if notifications are supported and allowed
     */
    async verifyNotificationSupport() {
      try {
        // Basic API support check
        if (!this.browserSupport.notifications) {
          throw new Error('Notifications are not supported in your browser')
        }

        // Permission state checks
        if (Notification.permission === 'denied') {
          throw new Error('Notifications are blocked in browser settings')
        }

        // Request permission if not determined
        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') {
            throw new Error('Permission not granted for notifications')
          }
        }
        return true
      } catch (error) {
        handleError(this, error.message, error)
        return false
      }
    },

    /**
     * Sends a test notification to verify functionality
     */
    async sendTestNotification() {
      try {
        const verified = await this.verifyNotificationSupport()
        if (!verified) return

        const userStore = useUserStore()
        const userId = requireUserId(userStore)

        // Guardar en Firestore
        await addDocument(collection(db, 'users', userId, 'notifications'), {
          message: 'Test notification',
          timestamp: new Date().toISOString(),
          read: false
        })

        // Create system notification
        console.log('Creating system notification...')
        new Notification('Test Notification', {
          body: 'This is a test notification from TodoList!',
          icon: 'mdi-bell-ring', // Using mdi icon as requested
          vibrate: [200, 100, 200] // Vibration pattern for mobile devices
        })

        console.log('System notification created successfully.')
        showSnackbar(this, 'Test notification sent successfully', 'success', 'mdi-bell-ring')
      } catch (error) {
        console.error('Error in sendTestNotification:', error)
        handleError(this, 'Error sending test notification', error)
      }
    },

    /**
     * Schedules notifications for all tasks based on user preferences
     * @param {Array} tasks - List of tasks to schedule notifications for
     */
    async scheduleNotifications() {
      try {
        if (!this.notificationSettings.enabled) return

        const taskStore = useTaskStore()
        const tasks = taskStore.tasksData

        this.clearTimeouts()

        const now = Date.now()
        const userStore = useUserStore()
        const userId = requireUserId(userStore)

        tasks.forEach((task) => {
          if (!task.endDate) return

          // Convertir a timestamp seguro
          const taskEndTime = task.endDate instanceof Date ? task.endDate.getTime() : null
          if (!taskEndTime) return

          this.notificationSettings.time.forEach((time) => {
            const notificationTime = taskEndTime - time * 3600000

            if (notificationTime > now && userId) {
              // Verificar userId
              const timeoutId = setTimeout(async () => {
                try {
                  // 1. Guardar notificación en Firestore
                  await addDocument(collection(db, 'users', userId, 'notifications'), {
                    message: `Task "${task.title}" due soon!`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    taskId: task.id,
                    icon: 'mdi-email-mark-as-unread'
                  })
                  showSnackbar(
                    this,
                    `New reminder: "${task.title}" is due soon!`,
                    'success',
                    'mdi-alarm'
                  )
                } catch (error) {
                  handleError(this, 'Failed to create notification', error)
                }
              }, notificationTime - now)

              this.timeouts.push({
                id: timeoutId,
                taskId: task.id,
                scheduledTime: notificationTime
              })
            }
          })
        })
      } catch (error) {
        handleError(this, 'Error scheduling notifications', error)
      }
    },

    /**
     * Displays a notification in UI and system tray
     * @param {string} message - Notification content to display
     */
    showNotification(message) {
      // Add to in-app notifications list
      this.activeNotifications.push({
        id: Date.now(),
        message,
        show: true,
        timestamp: new Date().toISOString()
      })

      // Create system notification if supported
      if (this.browserSupport.notifications && Notification.permission === 'granted') {
        new Notification('Task Reminder', {
          body: message,
          icon: '/task-notification-icon.png' // Custom icon for notification ==> dónde está la imagen?
        })
      }
    },

    async loadNotifications({ unreadOnly = false, pageSize, lastVisible, order } = {}) {
      const userStore = useUserStore()
      try {
        const userId = requireUserId(userStore)
        const q = buildNotificationQuery(userId, { unreadOnly, pageSize, lastVisible, order })
        const docs = await getCollection(q)
        this.activeNotifications = docs.map(mapFirestoreNotification)
      } catch (error) {
        handleError(this, 'Error loading notifications', error)
      }
    },

    async markAsRead(notificationId) {
      const userStore = useUserStore()
      try {
        const userId = requireUserId(userStore)

        // Eliminar de Firestore
        await deleteDocument(doc(db, 'users', userId, 'notifications', notificationId))

        // Actualizar estado local
        this.activeNotifications = this.activeNotifications.filter((n) => n.id !== notificationId)
        showSnackbar(this, 'Notification marked as read successfully', 'success', 'mdi-bell-check')
      } catch (error) {
        handleError(this, 'Error marking notification as read', error)
      }
    },

    async markAllAsRead() {
      const userStore = useUserStore()
      try {
        const userId = requireUserId(userStore)

        // Referencia a la colección de notificaciones
        const notificationsRef = collection(db, 'users', userId, 'notifications')

        // Obtener todas las notificaciones no leídas
        const q = query(notificationsRef, where('read', '==', false))
        const snapshot = await getDocs(q)

        // Obtener referencias de documentos
        const docRefs = snapshot.docs.map((doc) => doc.ref)

        // Eliminar documentos en batch
        await batchDeleteDocuments(db, docRefs)

        // Actualizar estado local
        this.activeNotifications = this.activeNotifications.filter(
          (n) => !snapshot.docs.some((d) => d.id === n.id)
        )

        showSnackbar(
          this,
          'All notifications marked as read successfully',
          'success',
          'mdi-check-all'
        )
      } catch (error) {
        handleError(this, 'Error marking all as read', error)
      }
    },

    formatTimeString(hours, minutes) {
      if (hours > 0 && minutes > 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
      }
      if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
    },

    /**
     * Clears all scheduled notification timeouts
     * Prevents memory leaks and duplicate notifications
     */
    clearTimeouts() {
      this.timeouts.forEach((t) => clearTimeout(t.id))
      this.timeouts = []
    },

    /**
     * Resets active in-app notifications
     */
    clearNotifications() {
      this.activeNotifications = []
    },

    unsubscribe() {
      if (this.unsubscribeNotifications) {
        this.unsubscribeNotifications()
        this.unsubscribeNotifications = null
      }
    }
  }
})
