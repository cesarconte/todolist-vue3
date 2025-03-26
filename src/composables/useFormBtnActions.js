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
          notificationsStore.showSnackbar = {
            show: true,
            message: 'An error occurred while processing the request.',
            color: 'error'
          }
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
