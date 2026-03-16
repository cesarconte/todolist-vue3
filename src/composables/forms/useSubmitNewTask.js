/**
 * Composable para enviar una nueva tarea.
 * @module useSubmitNewTask
 */

import { useTaskForm } from '@/composables/forms/useTaskForm'

export function useSubmitNewTask() {
  const { createTask } = useTaskForm()

  const submitNewTask = async () => {
    await createTask()
  }

  return {
    submitNewTask
  }
}
