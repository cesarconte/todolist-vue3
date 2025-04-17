// src/composables/useSubmitNewTask.js
import { useTaskStore } from '@/stores/taskStore'
import { formatDate } from '@/utils/dateFormat'

export function useSubmitNewTask(taskFormRef) {
  const taskStore = useTaskStore()

  const submitNewTask = async () => {
    try {
      if (!taskStore.newTask) {
        throw new Error('No task data found. Please reintente abrir el formulario.')
      }
      const formattedStartDate = formatDate(taskStore.newTask.startDate)
      const formattedEndDate = formatDate(taskStore.newTask.endDate)

      const newTaskData = {
        ...taskStore.newTask,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      }

      await taskStore.createTask(newTaskData)
      await taskStore.loadAllUserTasks()
      // Reset the form
      taskFormRef.value?.reset()
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  return {
    submitNewTask
  }
}
