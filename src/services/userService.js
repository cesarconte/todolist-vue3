/**
 * Servicio de dominio para operaciones de autenticación y usuario.
 * @module userService
 */

import { auth, db } from '@/config/firebase.js'
import { signInWithPopup, GoogleAuthProvider, signOut, onIdTokenChanged } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { getDocument, updateDocument } from '@/utils/firestore/firestoreCrud.js'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import { showSnackbar } from '@/utils/notifications/notificationHelpers.js'

/**
 * Obtiene el saludo según la hora del día.
 * @returns {string} 'morning', 'afternoon' o 'evening'
 */
export function getTimePeriod() {
  const hour = new Date().getHours()
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
}

const TIME_EMOJIS = Object.freeze({
  morning: '☕',
  afternoon: '🌞',
  evening: '🌙'
})

/**
 * Obtiene el emoji según la hora del día.
 * @returns {string} Emoji correspondiente.
 */
export function getTimeEmoji() {
  return TIME_EMOJIS[getTimePeriod()]
}

/**
 * Inicia sesión con Google.
 * @async
 * @param {string} [actionType='signin'] - Tipo de acción ('signin' o 'signup').
 * @returns {Promise<Object>} Objeto con el usuario de Firebase y si es nuevo.
 * @throws {Error} Si ocurre un error durante el login.
 */
export async function loginWithGoogle(actionType = 'signin') {
  const notificationsStore = useNotificationsStore()

  try {
    const provider = new GoogleAuthProvider()
    provider.addScope('profile')
    provider.addScope('email')
    provider.setCustomParameters({
      prompt: actionType === 'signup' ? 'select_account' : 'none'
    })

    const { user: firebaseUser } = await signInWithPopup(auth, provider)
    const { isNewUser } = await createUserDocument(firebaseUser)

    showSnackbar(
      notificationsStore,
      generateWelcomeMessage(firebaseUser, actionType, isNewUser),
      'success',
      isNewUser ? 'mdi-account-star' : 'mdi-account-check'
    )

    return { user: firebaseUser, isNewUser }
  } catch (error) {
    handleAuthError(error)
    throw error
  }
}

/**
 * Crea o actualiza el documento del usuario en Firestore.
 * @async
 * @param {Object} user - Usuario de Firebase Auth.
 * @returns {Promise<{isNewUser: boolean}>} Indica si es un usuario nuevo.
 */
export async function createUserDocument(user) {
  const userRef = doc(db, 'users', user.uid)
  const userDoc = await getDocument(userRef)

  const userData = {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: new Date(),
    loginCount: (userDoc?.loginCount || 0) + 1
  }

  if (userDoc) {
    await updateDocument(userRef, userData)
    return { isNewUser: false }
  }

  await setDoc(userRef, {
    ...userData,
    uid: user.uid,
    createdTasks: [],
    firstLogin: new Date()
  })

  return { isNewUser: true }
}

/**
 * Cierra la sesión del usuario.
 * @async
 * @returns {Promise<void>}
 */
export async function logout() {
  const notificationsStore = useNotificationsStore()

  try {
    const userName = 'Guest' // Se podría pasar como argumento si se necesita
    await signOut(auth)

    showSnackbar(
      notificationsStore,
      generateFarewellMessage(userName),
      'success',
      'mdi-account-arrow-left'
    )
  } catch (error) {
    handleAuthError(error)
    throw error
  }
}

/**
 * Genera el mensaje de bienvenida.
 * @param {Object} user - Usuario de Firebase.
 * @param {string} actionType - Tipo de acción.
 * @param {boolean} isNew - Si es un usuario nuevo.
 * @returns {string} Mensaje de bienvenida.
 */
function generateWelcomeMessage(user, actionType, isNew) {
  const name = user.displayName || user.email.split('@')[0]
  const emoji = getTimeEmoji()

  if (isNew) return `Welcome aboard, ${name}! 🚀`
  return actionType === 'signup'
    ? `Welcome back, ${name}! ${emoji}`
    : `Good ${getTimePeriod()} ${name}! ${emoji}`
}

/**
 * Genera el mensaje de despedida.
 * @param {string} name - Nombre del usuario.
 * @returns {string} Mensaje de despedida.
 */
function generateFarewellMessage(name) {
  const messages = [
    `See you soon, ${name}! 👋`,
    `Until next time, ${name}! 👋`,
    `Have a great ${getTimePeriod()}, ${name}! ${getTimeEmoji()}`
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * Configuraciones de errores de autenticación.
 */
const ERROR_CONFIGURATIONS = Object.freeze({
  'auth/popup-closed-by-user': {
    message: 'Login cancelled - popup closed ❌',
    icon: 'mdi-window-close',
    level: 'warning'
  },
  'auth/network-request-failed': {
    message: 'Network error - check connection 🌐',
    icon: 'mdi-wifi-off',
    level: 'error'
  },
  'auth/too-many-requests': {
    message: 'Too many attempts - try later 🚦',
    icon: 'mdi-timer-sand',
    level: 'warning'
  },
  'auth/cancelled-popup-request': {
    message: 'Login process already in progress ⚠️',
    icon: 'mdi-alert',
    level: 'info'
  },
  'auth/invalid-credential': {
    message: 'Session expired - please login again 🔄',
    icon: 'mdi-account-sync',
    level: 'error'
  },
  'auth/unauthorized-domain': {
    message: 'Domain not authorized - check Google Cloud Console 🔐',
    icon: 'mdi-shield-lock',
    level: 'error'
  },
  default: {
    message: 'Authentication error - try again 🔄',
    icon: 'mdi-alert',
    level: 'error'
  }
})

/**
 * Maneja errores de autenticación.
 * @param {Error} error - Error de Firebase.
 */
function handleAuthError(error) {
  const notificationsStore = useNotificationsStore()
  const config = ERROR_CONFIGURATIONS[error.code] || ERROR_CONFIGURATIONS.default

  const message = typeof config.message === 'function' ? config.message(error) : config.message

  showSnackbar(notificationsStore, message, config.level, config.icon)

  console.error('Auth Error:', {
    code: error.code,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  })
}

/**
 * Suscribe a cambios en el estado de autenticación.
 * @param {Function} callback - Callback que recibe el usuario actual.
 * @returns {Function} Función para cancelar la suscripción.
 */
export function subscribeToAuth(callback) {
  return onIdTokenChanged(auth, callback)
}
