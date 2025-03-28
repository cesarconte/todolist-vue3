import { defineStore } from 'pinia'
import { db } from '@/firebase'
import {
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  addDoc,
  orderBy,
  query,
  where,
  writeBatch,
  onSnapshot,
  collection
} from 'firebase/firestore'
import { useUserStore } from '@/stores/userStore'
import { useDataStore } from '@/stores/dataStore'

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
    // updateSnackbar(message, show = true, prependIcon = '', appendIcon = '', color = 'success') {
    //   this.showSnackbar = { show, message, prependIcon, appendIcon, color }
    // },
    updateSnackbar(message, show = true, prependIcon = '', appendIcon = '', color = 'success') {
      this.showSnackbar = { show, message, prependIcon, appendIcon, color }
    },
    showSnackbar(message, color = 'success', prependIcon = '', appendIcon = '') {
      this.updateSnackbar(message, true, prependIcon, appendIcon, color)
    },
    /**
     * Loads user notification settings from Firestore
     * Automatically schedules notifications if enabled
     */
    async loadSettings() {
      const userStore = useUserStore()
      try {
        if (!userStore.user) return

        // Fetch user document from Firestore
        const userDoc = await getDoc(doc(db, 'users', userStore.user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data.notificationSettings) {
            // Update local state with stored settings
            this.notificationSettings = data.notificationSettings

            // Schedule notifications if enabled
            if (this.notificationSettings.enabled) {
              const dataStore = useDataStore()
              this.scheduleNotifications(dataStore.tasksData)
            }
          }
        }

        // Suscribirse a notificaciones en tiempo real
        this.subscribeToNotifications()
      } catch (error) {
        this.handleError('Error loading settings', error)
      }
    },

    async subscribeToNotifications() {
      const userStore = useUserStore()
      if (!userStore.user || this.unsubscribeNotifications) return

      try {
        const q = query(
          collection(db, 'users', userStore.user.uid, 'notifications'),
          where('read', '==', false),
          orderBy('timestamp', 'desc')
        )

        this.unsubscribeNotifications = onSnapshot(q, (snapshot) => {
          // Forzar una actualización reactiva
          this.activeNotifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            show: true
          }))

          // Opcional: Mostrar snackbar para nuevas notificaciones
          // snapshot.docChanges().forEach((change) => {
          //   if (change.type === 'added') {
          //     this.showSnackbar = {
          //       show: true,
          //       message: 'New notification received!'
          //     }
          //   }
          // })
        })
      } catch (error) {
        this.handleError('Error subscribing to notifications', error)
      }
    },

    /**
     * Saves current notification settings to Firestore
     * Re-schedules notifications with updated settings
     */
    async saveSettings() {
      const userStore = useUserStore()
      try {
        if (!userStore.user) return

        // Update Firestore document with current settings
        await updateDoc(doc(db, 'users', userStore.user.uid), {
          notificationSettings: this.notificationSettings
        })

        // Clear existing timeouts and reschedule
        this.clearTimeouts()
        if (this.notificationSettings.enabled) {
          const dataStore = useDataStore()
          this.scheduleNotifications(dataStore.tasksData)
        }
      } catch (error) {
        this.handleError('Error saving settings', error)
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
        this.handleError(error.message, error)
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

        // Guardar en Firestore
        const userStore = useUserStore()
        if (userStore.user) {
          await addDoc(collection(db, 'users', userStore.user.uid, 'notifications'), {
            message: 'Test notification',
            timestamp: new Date().toISOString(),
            read: false
          })
        }

        // Create system notification
        new Notification('Test Notification', {
          body: 'This is a test notification from TodoList!',
          icon: '/notification-icon.png', // Custom icon for notification ==> dónde está la imagen?
          vibrate: [200, 100, 200] // Vibration pattern for mobile devices
        })

        // Show confirmation in UI
        this.showSnackbar = {
          show: true,
          message: 'Test notification sent successfully',
          prependIcon: 'mdi-bell-ring'
        }
      } catch (error) {
        this.handleError(error.message, error)
      }
    },

    /**
     * Schedules notifications for all tasks based on user preferences
     * @param {Array} tasks - List of tasks to schedule notifications for
     */
    async scheduleNotifications() {
      try {
        if (!this.notificationSettings.enabled) return

        const dataStore = useDataStore()
        const tasks = dataStore.tasksData

        this.clearTimeouts()

        const now = Date.now()
        const userStore = useUserStore()
        const userId = userStore.user?.uid // Capturar UID actual

        tasks.forEach((task) => {
          if (!task.endDate) return

          const taskEndTime = task.endDate.toDate().getTime()

          this.notificationSettings.time.forEach((time) => {
            const notificationTime = taskEndTime - time * 3600000

            if (notificationTime > now && userId) {
              // Verificar userId
              const timeoutId = setTimeout(async () => {
                try {
                  // 1. Guardar notificación en Firestore
                  await addDoc(collection(db, 'users', userId, 'notifications'), {
                    message: `Task "${task.title}" due soon!`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    taskId: task.id,
                    icon: 'mdi-email-mark-as-unread'
                  })
                  this.showSnackbar = {
                    show: true,
                    message: `New reminder: "${task.title}" is due soon!`,
                    prependIcon: 'mdi-alarm'
                  }
                } catch (error) {
                  this.handleError('Failed to create notification', error)
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
        this.handleError('Error scheduling notifications', error)
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

    async loadNotifications() {
      const userStore = useUserStore()
      try {
        if (!userStore.user) return

        const notificationsRef = collection(db, 'users', userStore.user.uid, 'notifications')
        const q = query(notificationsRef, orderBy('timestamp', 'desc'))

        const snapshot = await getDocs(q)
        this.activeNotifications = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp,
            show: true
          }
        })
      } catch (error) {
        this.handleError('Error loading notifications', error)
      }
    },

    async markAsRead(notificationId) {
      const userStore = useUserStore()
      try {
        if (!userStore.user || !notificationId) return

        // Eliminar de Firestore
        await deleteDoc(doc(db, 'users', userStore.user.uid, 'notifications', notificationId))

        // Actualizar estado local
        this.activeNotifications = this.activeNotifications.filter((n) => n.id !== notificationId)
        this.showSnackbar = {
          show: true,
          message: 'Notification marked as read successfully',
          prependIcon: 'mdi-bell-check'
        }
      } catch (error) {
        this.handleError('Error marking notification as read', error)
      }
    },

    async markAllAsRead() {
      const userStore = useUserStore()
      try {
        if (!userStore.user) return

        // Referencia a la colección de notificaciones
        const notificationsRef = collection(db, 'users', userStore.user.uid, 'notifications')

        // Obtener todas las notificaciones no leídas
        const q = query(notificationsRef, where('read', '==', false))
        const snapshot = await getDocs(q)

        // Crear batch de eliminaciones
        const batch = writeBatch(db)
        snapshot.forEach((doc) => {
          batch.delete(doc.ref)
        })

        await batch.commit()

        // Actualizar estado local
        this.activeNotifications = this.activeNotifications.filter(
          (n) => !snapshot.docs.some((d) => d.id === n.id)
        )

        this.showSnackbar = {
          show: true,
          message: 'All notifications marked as read successfully',
          prependIcon: 'mdi-check-all'
        }
      } catch (error) {
        this.handleError('Error marking all as read', error)
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

    /**
     * Centralized error handling for notification operations
     * @param {string} message - User-friendly error message
     * @param {Error} error - Original error object
     */
    handleError(message, error) {
      console.error('Notification error:', error)

      // Show error in UI
      this.showSnackbar = {
        show: true,
        message: `${message}: ${error.message || 'Unknown error'}`,
        prependIcon: 'mdi-alert-circle'
      }

      // Automatically disable notifications if permission denied
      if (error.message.includes('Permission not granted')) {
        this.notificationSettings.enabled = false
      }
    },

    unsubscribe() {
      if (this.unsubscribeNotifications) {
        this.unsubscribeNotifications()
        this.unsubscribeNotifications = null
      }
    }
  }
})
