/**
 * Composable para enviar una tarea editada.
 * @module useSubmitEditedTask
 */

import { useTaskForm } from '@/composables/forms/useTaskForm'

export function useSubmitEditedTask() {
  const { updateTask } = useTaskForm()

  const submitEditedTask = async () => {
    await updateTask()
  }

  return {
    submitEditedTask
  }
}
