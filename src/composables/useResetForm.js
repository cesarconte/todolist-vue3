// src/composables/useResetForm.js
import { useNotificationsStore } from '@/stores/notificationsStore'
import { showSnackbar } from '@/utils/notificationHelpers.js' // Import the helper

export function useResetForm(
  formRef,
  successMessage = 'Form has been reset',
  notificationType = 'info',
  notificationIcon = 'mdi-information',
  customResetCallback = null
) {
  const notificationsStore = useNotificationsStore()

  const reset = () => {
    if (formRef && formRef.value && typeof formRef.value.reset === 'function') {
      formRef.value.reset()
      if (customResetCallback) {
        customResetCallback()
      }
      showSnackbar(notificationsStore, successMessage, notificationType, notificationIcon) // Use the centralized helper function
    }
  }

  return { reset }
}
