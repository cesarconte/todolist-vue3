// src/composables/useFormBtnActions.js

import { useNotificationsStore } from '@/stores/notificationsStore'

export const useFormBtnActions = (submitFn, resetFn, closeFn) => {
  const notificationsStore = useNotificationsStore()

  const btnsForm = [
    {
      type: 'submit',
      height: '3rem',
      text: '', // The text will be configured in the component
      icon: '', // The icon will be configured in the component
      function: async () => {
        try {
          await submitFn()
          closeFn()
        } catch (error) {
          console.error('Error during submit:', error)
          // Usar el helper centralizado para mostrar la notificación
          const { showSnackbar } = await import('@/utils/notifications/notificationHelpers.js')
          showSnackbar(
            notificationsStore,
            'An error occurred while processing the request.',
            'error',
            'mdi-alert-circle',
            ''
          )
        }
      }
    },
    {
      type: 'button',
      height: '3rem',
      text: 'Reset Form',
      icon: 'mdi-refresh',
      function: resetFn
    },
    {
      type: 'button',
      height: '3rem',
      text: 'Close',
      icon: 'mdi-close',
      function: closeFn
    }
  ]

  return { btnsForm }
}
