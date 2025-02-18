// useLabelIcons.js
import { ref } from 'vue'

export default function useLabelIcons() {
  const labelIcons = ref({
    critical: 'mdi-alert-circle-outline',
    important: 'mdi-star-circle-outline',
    limited: 'mdi-chevron-down-circle-outline',
    moderate: 'mdi-minus-circle-outline',
    regular: 'mdi-circle-outline'
  })

  return { labelIcons }
}
