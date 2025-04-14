// src/composables/useResetForm.js
import { useNotificationsStore } from '@/stores/notificationsStore'

export function useResetForm(
  formRef,
  successMessage = 'Form has been reset',
  notificationType = 'info',
  notificationIcon = 'mdi-information',
  customResetCallback = null
) {
  const notificationsStore = useNotificationsStore()

  const reset = () => {
    if (formRef.value) {
      formRef.value.reset()
      if (customResetCallback) {
        customResetCallback()
      }
      notificationsStore.displaySnackbar(successMessage, notificationType, notificationIcon)
    }
  }

  return { reset }
}
