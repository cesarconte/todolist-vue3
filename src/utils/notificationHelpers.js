// utils/notificationHelpers.js

/**
 * Muestra un snackbar o notificación en la store.
 * @param {object} store - La store de notificaciones (o cualquier objeto con showSnackbar).
 * @param {string} message - Mensaje a mostrar.
 * @param {string} color - Color del snackbar ('success', 'error', etc).
 * @param {string} prependIcon - Icono opcional.
 * @param {string} appendIcon - Icono opcional.
 */
export function showSnackbar(store, message, color = 'success', prependIcon = '', appendIcon = '') {
  if (store && typeof store.updateSnackbar === 'function') {
    store.updateSnackbar(message, true, prependIcon, appendIcon, color)
  } else if (store && typeof store.displaySnackbar === 'function') {
    store.displaySnackbar(message, color, prependIcon, appendIcon)
  } else if (store && store.showSnackbar) {
    store.showSnackbar = { show: true, message, prependIcon, appendIcon, color }
  }
}

/**
 * Centraliza el manejo de errores y muestra un snackbar.
 * @param {object} store - La store de notificaciones.
 * @param {string} userMessage - Mensaje amigable para el usuario.
 * @param {Error} error - Objeto de error original.
 */
export function handleError(store, userMessage, error) {
  console.error(userMessage, error)
  showSnackbar(
    store,
    `${userMessage}: ${error?.message || 'Unknown error'}`,
    'error',
    'mdi-alert-circle'
  )
}

/**
 * Valida que el usuario esté autenticado y retorna el userId si es válido.
 * Lanza un error si no está autenticado.
 */
export function requireUserId(userStore) {
  const userId = userStore?.user?.uid || userStore?.userId
  if (!userId) throw new Error('User must be logged in')
  return userId
}