/**
 * Servicio de dominio para operaciones relacionadas con notificaciones.
 * @module notificationService
 */

import { db } from '@/config/firebase.js'
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import {
  getDocument,
  getCollection,
  addDocument,
  deleteDocument
} from '@/utils/firestore/firestoreCrud.js'
import { mapFirestoreNotification } from '@/utils/notifications/notificationMappers.js'
import { buildNotificationQuery } from '@/utils/notifications/notificationQueries.js'
import { batchDeleteDocuments } from '@/utils/firestore/firestoreBatch.js'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import { showSnackbar, handleError } from '@/utils/notifications/notificationHelpers.js'

/**
 * Carga la configuración de notificaciones del usuario.
 * @async
 * @param {string} userId - ID del usuario.
 * @returns {Promise<Object>} Configuración del usuario.
 */
export async function loadSettings(userId) {
  try {
    const userDoc = await getDocument(doc(db, 'users', userId))
    if (userDoc && userDoc.notificationSettings) {
      return userDoc.notificationSettings
    }
    return null
  } catch (error) {
    throw new Error(`Error loading settings: ${error.message}`)
  }
}

/**
 * Guarda la configuración de notificaciones del usuario.
 * @async
 * @param {string} userId - ID del usuario.
 * @param {Object} settings - Configuración a guardar.
 * @returns {Promise<void>}
 */
export async function saveSettings(userId, settings) {
  const notificationsStore = useNotificationsStore()

  try {
    await updateDoc(doc(db, 'users', userId), {
      notificationSettings: settings
    })
    showSnackbar(notificationsStore, 'Settings saved!', 'success', 'mdi-content-save')
  } catch (error) {
    handleError(notificationsStore, 'Error saving settings', error)
    throw error
  }
}

/**
 * Crea una nueva notificación.
 * @async
 * @param {string} userId - ID del usuario.
 * @param {Object} data - Datos de la notificación.
 * @returns {Promise<string>} ID del documento creado.
 */
export async function createNotification(userId, data) {
  try {
    const notificationData = {
      ...data,
      timestamp: serverTimestamp(),
      read: false
    }

    const docRef = await addDocument(
      collection(db, 'users', userId, 'notifications'),
      notificationData
    )
    return docRef.id
  } catch (error) {
    throw new Error(`Error creating notification: ${error.message}`)
  }
}

/**
 * Elimina una notificación.
 * @async
 * @param {string} userId - ID del usuario.
 * @param {string} notificationId - ID de la notificación.
 * @returns {Promise<void>}
 */
export async function deleteNotification(userId, notificationId) {
  const notificationsStore = useNotificationsStore()

  try {
    await deleteDocument(doc(db, 'users', userId, 'notifications', notificationId))
    showSnackbar(notificationsStore, 'Notification deleted', 'success', 'mdi-bell-check')
  } catch (error) {
    handleError(notificationsStore, 'Error deleting notification', error)
    throw error
  }
}

/**
 * Marca todas las notificaciones como leídas.
 * @async
 * @param {string} userId - ID del usuario.
 * @returns {Promise<void>}
 */
export async function markAllAsRead(userId) {
  const notificationsStore = useNotificationsStore()

  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications')
    const q = query(notificationsRef, where('read', '==', false))
    const snapshot = await getDocs(q)

    if (snapshot.empty) return

    const docRefs = snapshot.docs.map((d) => d.ref)
    await batchDeleteDocuments(db, docRefs)

    showSnackbar(
      notificationsStore,
      'All notifications marked as read successfully',
      'success',
      'mdi-check-all'
    )
  } catch (error) {
    handleError(notificationsStore, 'Error marking all as read', error)
    throw error
  }
}

/**
 * Suscribe a notificaciones en tiempo real.
 * @param {string} userId - ID del usuario.
 * @param {Object} options - Opciones de consulta.
 * @param {Function} callback - Callback para manejar cambios.
 * @returns {Function} Función para cancelar la suscripción.
 */
export function subscribeToNotifications(userId, options = {}, callback) {
  const { unreadOnly = true, pageSize, lastVisible, order } = options

  const q = buildNotificationQuery(userId, { unreadOnly, pageSize, lastVisible, order })

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => mapFirestoreNotification(doc))
    callback(notifications)
  })
}

/**
 * Carga notificaciones (sin suscripción).
 * @async
 * @param {string} userId - ID del usuario.
 * @param {Object} options - Opciones de consulta.
 * @returns {Promise<Array>} Lista de notificaciones.
 */
export async function loadNotifications(userId, options = {}) {
  const { unreadOnly = false, pageSize, lastVisible, order } = options

  try {
    const q = buildNotificationQuery(userId, { unreadOnly, pageSize, lastVisible, order })
    const docs = await getCollection(q)
    return docs.map((doc) => mapFirestoreNotification(doc))
  } catch (error) {
    throw new Error(`Error loading notifications: ${error.message}`)
  }
}
