import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useTaskStore } from '@/stores/taskStore'
import {
  showSnackbar,
  handleError,
  requireUserId
} from '@/utils/notifications/notificationHelpers.js'
import * as notificationService from '@/services/notificationService.js'

export const useNotificationsStore = defineStore('notifications', () => {
  const notificationSettings = ref({
    enabled: false,
    time: []
  })

  const activeNotifications = ref([])

  const timeouts = ref([])

  const showSnackbarState = ref({
    show: false,
    message: '',
    prependIcon: '',
    appendIcon: '',
    color: 'success'
  })

  const browserSupport = ref({
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window
  })

  const unsubscribeNotifications = ref(null)

  const isLoading = ref(false)
  const error = ref(null)

  const nextScheduledCheck = computed(() => {
    if (timeouts.value.length === 0) return 'No scheduled notifications'
    const nextTime = Math.min(...timeouts.value.map((t) => t.scheduledTime))
    return new Date(nextTime).toLocaleString()
  })

  const hasFullSupport = computed(() => {
    return Object.values(browserSupport.value).every(Boolean)
  })

  const unreadCount = computed(() => activeNotifications.value.filter((n) => !n.read).length)

  async function loadSettings() {
    const userStore = useUserStore()
    isLoading.value = true
    error.value = null
    try {
      const userId = requireUserId(userStore)

      const settings = await notificationService.loadSettings(userId)
      if (settings) {
        notificationSettings.value = settings
        if (notificationSettings.value.enabled) {
          const taskStore = useTaskStore()
          scheduleNotifications(taskStore.tasksData)
        }
      }

      subscribeToNotifications()
    } catch (err) {
      error.value = err.message ?? 'Error loading settings'
      handleError({ showSnackbar: showSnackbarState.value }, 'Error loading settings', err)
    } finally {
      isLoading.value = false
    }
  }

  async function subscribeToNotifications({
    unreadOnly = true,
    pageSize,
    lastVisible,
    order
  } = {}) {
    const userStore = useUserStore()
    if (unsubscribeNotifications.value) return

    try {
      const userId = requireUserId(userStore)
      unsubscribeNotifications.value = notificationService.subscribeToNotifications(
        userId,
        { unreadOnly, pageSize, lastVisible, order },
        (notifications) => {
          activeNotifications.value = notifications
        }
      )
    } catch (err) {
      error.value = err.message ?? 'Error subscribing to notifications'
      handleError(
        { showSnackbar: showSnackbarState.value },
        'Error subscribing to notifications',
        err
      )
    }
  }

  async function saveSettings(showSuccess = false) {
    const userStore = useUserStore()
    isLoading.value = true
    error.value = null
    try {
      const userId = requireUserId(userStore)

      await notificationService.saveSettings(userId, notificationSettings.value)

      clearTimeouts()
      if (notificationSettings.value.enabled) {
        const taskStore = useTaskStore()
        scheduleNotifications(taskStore.tasksData)
      }

      if (showSuccess) {
        showSnackbar(
          { showSnackbar: showSnackbarState.value },
          'Settings saved!',
          'success',
          'mdi-content-save'
        )
      }
    } catch (err) {
      error.value = err.message ?? 'Error saving settings'
      handleError({ showSnackbar: showSnackbarState.value }, 'Error saving settings', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function verifyNotificationSupport() {
    try {
      if (!browserSupport.value.notifications) {
        throw new Error('Notifications are not supported in your browser')
      }

      if (Notification.permission === 'denied') {
        throw new Error('Notifications are blocked in browser settings')
      }

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          throw new Error('Permission not granted for notifications')
        }
      }
      return true
    } catch (err) {
      error.value = err.message
      handleError({ showSnackbar: showSnackbarState.value }, err.message, err)
      return false
    }
  }

  async function sendTestNotification() {
    try {
      const verified = await verifyNotificationSupport()
      if (!verified) return

      const userStore = useUserStore()
      const userId = requireUserId(userStore)

      await notificationService.createNotification(userId, {
        message: 'Test notification',
        icon: 'mdi-bell-ring-outline'
      })

      new Notification('Test Notification', {
        body: 'This is a test notification from TodoList!',
        icon: 'mdi-bell-ring',
        vibrate: [200, 100, 200]
      })

      showSnackbar(
        { showSnackbar: showSnackbarState.value },
        'Test notification sent successfully',
        'success',
        'mdi-bell-ring'
      )
    } catch (err) {
      console.error('Error in sendTestNotification:', err)
      handleError({ showSnackbar: showSnackbarState.value }, 'Error sending test notification', err)
    }
  }

  async function scheduleNotifications() {
    try {
      if (!notificationSettings.value.enabled) return

      const taskStore = useTaskStore()
      const tasks = taskStore.tasksData

      clearTimeouts()

      const now = Date.now()
      const userStore = useUserStore()
      const userId = requireUserId(userStore)

      tasks.forEach((task) => {
        if (!task.endDate) return

        const taskEndTime = task.endDate instanceof Date ? task.endDate.getTime() : null
        if (!taskEndTime) return

        notificationSettings.value.time.forEach((time) => {
          const notificationTime = taskEndTime - time * 3600000

          if (notificationTime > now && userId) {
            const timeoutId = setTimeout(async () => {
              try {
                await notificationService.createNotification(userId, {
                  message: `Task "${task.title}" due soon!`,
                  taskId: task.id,
                  icon: 'mdi-email-mark-as-unread'
                })
                showSnackbar(
                  { showSnackbar: showSnackbarState.value },
                  `New reminder: "${task.title}" is due soon!`,
                  'success',
                  'mdi-alarm'
                )
              } catch (err) {
                handleError(
                  { showSnackbar: showSnackbarState.value },
                  'Failed to create notification',
                  err
                )
              }
            }, notificationTime - now)

            timeouts.value.push({
              id: timeoutId,
              taskId: task.id,
              scheduledTime: notificationTime
            })
          }
        })
      })
    } catch (err) {
      error.value = err.message ?? 'Error scheduling notifications'
      handleError({ showSnackbar: showSnackbarState.value }, 'Error scheduling notifications', err)
    }
  }

  function showNotification(message) {
    activeNotifications.value.push({
      id: Date.now(),
      message,
      show: true,
      timestamp: new Date().toISOString()
    })

    if (browserSupport.value.notifications && Notification.permission === 'granted') {
      new Notification('Task Reminder', {
        body: message,
        icon: '/task-notification-icon.png'
      })
    }
  }

  async function loadNotifications({ unreadOnly = false, pageSize, lastVisible, order } = {}) {
    const userStore = useUserStore()
    isLoading.value = true
    error.value = null
    try {
      const userId = requireUserId(userStore)
      const notifications = await notificationService.loadNotifications(userId, {
        unreadOnly,
        pageSize,
        lastVisible,
        order
      })
      activeNotifications.value = notifications
    } catch (err) {
      error.value = err.message ?? 'Error loading notifications'
      handleError({ showSnackbar: showSnackbarState.value }, 'Error loading notifications', err)
    } finally {
      isLoading.value = false
    }
  }

  async function markAsRead(notificationId) {
    const userStore = useUserStore()
    isLoading.value = true
    error.value = null
    try {
      const userId = requireUserId(userStore)
      await notificationService.deleteNotification(userId, notificationId)
      activeNotifications.value = activeNotifications.value.filter((n) => n.id !== notificationId)
      showSnackbar(
        { showSnackbar: showSnackbarState.value },
        'Notification marked as read successfully',
        'success',
        'mdi-bell-check'
      )
    } catch (err) {
      error.value = err.message ?? 'Error marking notification as read'
      handleError(
        { showSnackbar: showSnackbarState.value },
        'Error marking notification as read',
        err
      )
    } finally {
      isLoading.value = false
    }
  }

  async function markAllAsRead() {
    const userStore = useUserStore()
    isLoading.value = true
    error.value = null
    try {
      const userId = requireUserId(userStore)
      await notificationService.markAllAsRead(userId)
      activeNotifications.value = []
      showSnackbar(
        { showSnackbar: showSnackbarState.value },
        'All notifications marked as read successfully',
        'success',
        'mdi-check-all'
      )
    } catch (err) {
      error.value = err.message ?? 'Error marking all as read'
      handleError({ showSnackbar: showSnackbarState.value }, 'Error marking all as read', err)
    } finally {
      isLoading.value = false
    }
  }

  function formatTimeString(hours, minutes) {
    if (hours > 0 && minutes > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
    }
    if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  }

  function clearTimeouts() {
    timeouts.value.forEach((t) => clearTimeout(t.id))
    timeouts.value = []
  }

  function clearNotifications() {
    activeNotifications.value = []
  }

  function unsubscribe() {
    if (unsubscribeNotifications.value) {
      unsubscribeNotifications.value()
      unsubscribeNotifications.value = null
    }
  }

  function reset() {
    notificationSettings.value = { enabled: false, time: [] }
    activeNotifications.value = []
    clearTimeouts()
    unsubscribe()
    isLoading.value = false
    error.value = null
  }

  return {
    notificationSettings,
    activeNotifications,
    timeouts,
    showSnackbar: showSnackbarState,
    browserSupport,
    isLoading,
    error,
    nextScheduledCheck,
    hasFullSupport,
    unreadCount,
    loadSettings,
    subscribeToNotifications,
    saveSettings,
    verifyNotificationSupport,
    sendTestNotification,
    scheduleNotifications,
    showNotification,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    formatTimeString,
    clearTimeouts,
    clearNotifications,
    unsubscribe,
    reset
  }
})
