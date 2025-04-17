// src/composables/useDialogCleanup.js
import { watch } from 'vue'
export function useDialogCleanup(dialogRef, resetFn) {
  watch(dialogRef, (val) => {
    if (!val) resetFn()
  })
}
