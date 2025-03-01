import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { useUserStore } from '@/stores/userStore'
import { useDataStore } from '@/stores/dataStore'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notificationSettings: {
      enabled: false,
      time: []
    },
    activeNotifications: [],
    timeouts: [], // Array de objetos { id: timeoutId, scheduledTime: timestamp }
    showSnackbar: {
      show: false,
      message: ''
    },
    browserSupport: {
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window
    }
  }),

  getters: {
    nextScheduledCheck: (state) => {
      if (state.timeouts.length === 0) return 'No hay notificaciones programadas'
      const nextTime = Math.min(...state.timeouts.map((t) => t.scheduledTime))
      return new Date(nextTime).toLocaleString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    hasFullSupport: (state) => {
      return Object.values(state.browserSupport).every(Boolean)
    }
  },

  actions: {
    async loadSettings() {
      const userStore = useUserStore()
      try {
        if (!userStore.user) return

        const userDoc = await getDoc(doc(db, 'users', userStore.user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data.notificationSettings) {
            this.notificationSettings = data.notificationSettings
            // Programar notificaciones al cargar configuración
            if (this.notificationSettings.enabled) {
              const dataStore = useDataStore()
              this.scheduleNotifications(dataStore.tasksData)
            }
          }
        }
      } catch (error) {
        this.handleError('Error cargando configuración', error)
      }
    },

    async saveSettings() {
      const userStore = useUserStore()
      try {
        if (!userStore.user) return

        await updateDoc(doc(db, 'users', userStore.user.uid), {
          notificationSettings: this.notificationSettings
        })

        // Re-programar notificaciones
        this.clearTimeouts()
        if (this.notificationSettings.enabled) {
          const dataStore = useDataStore()
          this.scheduleNotifications(dataStore.tasksData)
        }
      } catch (error) {
        this.handleError('Error guardando configuración', error)
        throw error
      }
    },

    async verifyNotificationSupport() {
      try {
        if (!this.browserSupport.notifications) {
          throw new Error('Las notificaciones no están soportadas en tu navegador')
        }

        if (Notification.permission === 'denied') {
          throw new Error('Las notificaciones están bloqueadas en la configuración del navegador')
        }

        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') {
            throw new Error('Permiso no concedido para notificaciones')
          }
        }
        return true
      } catch (error) {
        this.handleError(error.message, error)
        return false
      }
    },

    async sendTestNotification() {
      try {
        const verified = await this.verifyNotificationSupport()
        if (!verified) return

        new Notification('Prueba de Notificación', {
          body: 'Esta es una notificación de prueba de tu lista de tareas',
          icon: '/notification-icon.png',
          vibrate: [200, 100, 200]
        })

        this.showSnackbar = {
          show: true,
          message: 'Notificación de prueba enviada correctamente ✅'
        }
      } catch (error) {
        this.handleError(error.message, error)
      }
    },

    scheduleNotifications(tasks) {
      if (!tasks || !this.notificationSettings.enabled) return

      const now = Date.now()
      this.clearTimeouts()

      tasks.forEach((task) => {
        if (!task.endDate) return

        const taskEndTime = task.endDate.toDate().getTime()
        this.notificationSettings.time.forEach((time) => {
          const notificationTime = taskEndTime - time * 3600000

          if (notificationTime > now) {
            const timeoutId = setTimeout(() => {
              this.showNotification(
                `¡La tarea "${task.title}" vence en ${time} ${time === 1 ? 'hora' : 'horas'}!`
              )
              // Eliminar el timeout después de ejecutarse
              this.timeouts = this.timeouts.filter((t) => t.id !== timeoutId)
            }, notificationTime - now)

            this.timeouts.push({
              id: timeoutId,
              scheduledTime: notificationTime,
              taskId: task.id
            })
          }
        })
      })
    },

    showNotification(message) {
      this.activeNotifications.push({
        id: Date.now(),
        message,
        show: true,
        timestamp: new Date().toISOString()
      })

      // Mostrar notificación del sistema si está soportado
      if (this.browserSupport.notifications && Notification.permission === 'granted') {
        new Notification('Recordatorio de Tarea', {
          body: message,
          icon: '/task-notification-icon.png'
        })
      }
    },

    clearTimeouts() {
      this.timeouts.forEach((t) => clearTimeout(t.id))
      this.timeouts = []
    },

    clearNotifications() {
      this.activeNotifications = []
    },

    handleError(message, error) {
      console.error('Error en notificaciones:', error)
      this.showSnackbar = {
        show: true,
        message: `${message}: ${error.message || 'Error desconocido'}`
      }

      // Revertir estado si hay error de permisos
      if (error.message.includes('Permiso no concedido')) {
        this.notificationSettings.enabled = false
      }
    }
  }
})
