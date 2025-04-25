// src/composables/useResetForm.js
import { useNotificationsStore } from '@/stores/notificationsStore'
import { showSnackbar } from '@/utils/notifications/notificationHelpers.js' // Import the helper

export function useResetForm(
  formRef,
  successMessage = 'Form has been reset',
  notificationType = 'info',
  notificationIcon = 'mdi-information',
  customResetCallback = null
) {
  const notificationsStore = useNotificationsStore()

  const reset = () => {
    // Ejecuta siempre el callback personalizado primero (para limpiar el modelo reactivo)
    if (typeof customResetCallback === 'function') {
      customResetCallback()
    }
    // Luego resetea el formulario visual si existe
    if (formRef && formRef.value && typeof formRef.value.reset === 'function') {
      formRef.value.reset()
    }
    showSnackbar(notificationsStore, successMessage, notificationType, notificationIcon)
  }

  return { reset }
}
