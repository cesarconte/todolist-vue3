// notificationsStore.js

import { defineStore } from 'pinia'
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from './dataStore.js'
import { onSnapshot, query, collection } from 'firebase/firestore'
import { db } from '../firebase.js'

export const useNotificationsStore = defineStore('notifications', () => {
  const dataStore = useDataStore()

  // *** STATE ***
  const notificationSettings = ref({
    enabled: JSON.parse(localStorage.getItem('enableNotifications')) || false,
    time: JSON.parse(localStorage.getItem('notificationTime')) || 24 // Default: 24 hours before due date
  })

  const showSnackbar = ref({
    message: '',
    show: false
  })

  const globalNotificationIntervals = ref([
    { timeUnit: 'days', timeValue: 1, enabled: false, title: '1 day before' },
    { timeUnit: 'hours', timeValue: 12, enabled: false, title: '12 hours before' },
    { timeUnit: 'hours', timeValue: 6, enabled: false, title: '6 hours before' },
    { timeUnit: 'hours', timeValue: 3, enabled: false, title: '3 hours before' },
    { timeUnit: 'hours', timeValue: 2, enabled: false, title: '2 hours before' },
    { timeUnit: 'hours', timeValue: 1, enabled: false, title: '1 hour before' },
    { timeUnit: 'minutes', timeValue: 45, enabled: false, title: '45 minutes before' },
    { timeUnit: 'minutes', timeValue: 30, enabled: false, title: '30 minutes before' },
    { timeUnit: 'minutes', timeValue: 15, enabled: false, title: '15 minutes before' },
    { timeUnit: 'minutes', timeValue: 10, enabled: false, title: '10 minutes before' },
    { timeUnit: 'minutes', timeValue: 5, enabled: false, title: '5 minutes before' }
  ])

  // *** GETTERS ***
  const enabledNotifications = computed(() => notificationSettings.value.enabled)
  const notificationTime = computed(() => notificationSettings.value.time)

  // *** ACTIONS ***
  const getNotificationTimeMS = (interval) => {
    const timeUnitsMS = {
      days: 24 * 60 * 60 * 1000,
      hours: 60 * 60 * 1000,
      minutes: 60 * 1000
    }
    return interval.timeValue * timeUnitsMS[interval.timeUnit] || 0
  }

  const scheduleNotification = (task, interval) => {
    const now = new Date()
    const dueDate = new Date(task.dueDate)
    const timeUntilDue = dueDate.getTime() - now.getTime()
    const notificationOffset = getNotificationTimeMS(interval)

    if (timeUntilDue > 0 && timeUntilDue > notificationOffset) {
      setTimeout(() => {
        const timeRemaining = timeUntilDue - notificationOffset
        const formattedTime = formatTimeRemaining(timeRemaining, interval.timeUnit)
        showNotification(`Reminder: Task '${task.title}' is due in ${formattedTime}.
          ${task.description ? `\n${task.description.slice(0, 50)}${task.description.length > 50 ? '...' : ''}` : ''}`)
      }, timeUntilDue - notificationOffset)
    }
  }

  const formatTimeRemaining = (timeMS, timeUnit) => {
    const timeUnits = {
      days: Math.floor(timeMS / (1000 * 60 * 60 * 24)),
      hours: Math.floor(timeMS / (1000 * 60 * 60)),
      minutes: Math.floor(timeMS / (1000 * 60))
    }
    const timeValue = timeUnits[timeUnit]
    return `${timeValue} ${timeUnit}${timeValue > 1 ? 's' : ''}`
  }

  const scheduleTaskNotifications = (task) => {
    globalNotificationIntervals.value.forEach((interval) => {
      if (interval.enabled) {
        scheduleNotification(task, interval)
      }
    })
  }

  const updateNotifications = () => {
    if (enabledNotifications.value) {
      dataStore.tasks.forEach(scheduleTaskNotifications)
    }
  }

  const showNotification = (message) => {
    showSnackbar.value.message = message
    showSnackbar.value.show = true
  }

  const listenForTaskUpdates = () => {
    const tasksRef = collection(db, 'tasks')
    onSnapshot(query(tasksRef), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          scheduleTaskNotifications(change.doc.data())
        }
      })
    })
  }

  // *** LIFECYCLE HOOKS  ***
  onMounted(() => {
    updateNotifications()
    listenForTaskUpdates()
  })

  watch(
    notificationSettings.value,
    () => {
      localStorage.setItem(
        'enableNotifications',
        JSON.stringify(notificationSettings.value.enabled)
      )
      localStorage.setItem('notificationTime', JSON.stringify(notificationSettings.value.time))
      updateNotifications()
    },
    { deep: true }
  )

  watch(() => dataStore.tasks, updateNotifications, { immediate: true })

  // *** RETURN ***
  return {
    // State
    notificationSettings,
    showSnackbar,
    globalNotificationIntervals,
    // Getters
    enabledNotifications,
    notificationTime,
    // Actions
    updateNotifications,
    showNotification,
    listenForTaskUpdates,
    scheduleTaskNotifications,
    getNotificationTimeMS,
    formatTimeRemaining
  }
})
