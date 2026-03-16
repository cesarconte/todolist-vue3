// src/composables/useFormBtnActions.js

import { useNotificationsStore } from '@/stores/notificationsStore'

export const useFormBtnActions = (submitFn, resetFn, closeFn) => {
  const notificationsStore = useNotificationsStore()

  // Según MD3, en diálogos:
  // - Cancel debe ser texto (menos prominente)
  // - La acción secundaria debe ser tonal o texto
  // - La acción primaria debe ser filled/elevated (más prominente)
  const btnsForm = [
    {
      type: 'submit',
      height: '2.5rem',
      text: '', // Se configurará en el componente
      icon: '', // Se configurará en el componente
      color: 'primary', // Color primario para acción principal (MD3)
      variant: 'elevated', // La variante más prominente para acción principal (MD3)
      rounded: 'xl', // Bordes redondeados según MD3 shape scale
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
      height: '2.5rem',
      text: 'reset',
      icon: 'mdi-refresh',
      color: 'surface-variant', // Color secundario para acción alternativa (MD3)
      variant: 'tonal', // Variante intermedia para acción secundaria (MD3)
      rounded: 'xl', // Bordes redondeados según MD3 shape scale
      function: resetFn
    },
    {
      type: 'button',
      height: '2.5rem',
      text: 'cancel',
      icon: 'mdi-close',
      variant: 'text', // Variante menos prominente para cancelación (MD3)
      rounded: 'xl', // Bordes redondeados según MD3 shape scale
      function: closeFn
    }
  ]

  return { btnsForm }
}
