// src/composables/useDialogCleanup.js
import { isRef, watch } from 'vue'
export function useDialogCleanup(dialogRef, resetFn) {
  // Asegura que dialogRef sea un ref, si no, crea un watcher seguro
  if (isRef(dialogRef)) {
    watch(dialogRef, (val) => {
      if (!val) resetFn()
    })
  } else {
    // fallback seguro: no hacer nada o advertir
    console.warn('useDialogCleanup: dialogRef no es un ref de Vue')
  }
}
