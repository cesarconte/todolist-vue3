// Motivational progress composable: returns color (and optionally icon/message) based on percentage
import { computed } from 'vue'

export function useMotivationalProgress(percentageRef) {
  const getMotivationalColor = (percentage) => {
    if (percentage === 100) return 'success'
    if (percentage >= 75) return 'primary'
    if (percentage >= 50) return 'secondary'
    if (percentage >= 25) return 'warning'
    if (percentage > 0) return 'error'
    return 'grey'
  }

  const color = computed(() => getMotivationalColor(percentageRef.value))

  // Opcional: puedes agregar icono o mensaje aquí si lo necesitas en el futuro
  return { color }
}
