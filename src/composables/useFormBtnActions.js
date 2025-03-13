// src/composables/useFormBtnActions.js

export const useFormBtnActions = (submitFn, resetFn, closeFn) => {
  const btnsForm = [
    {
      type: 'submit',
      height: '3rem',
      text: 'Save Edit',
      icon: 'mdi-check',
      function: submitFn
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
