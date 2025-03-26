// src/composables/useSubmitNewTask.js
import { useDataStore } from '@/stores/dataStore'
import { formatDate } from '@/utils/dateFormat'

export function useSubmitNewTask() {
  const dataStore = useDataStore()

  const submitNewTask = async () => {
    try {
      const formattedStartDate = formatDate(dataStore.newTask.startDate)
      const formattedEndDate = formatDate(dataStore.newTask.endDate)

      const newTaskData = {
        ...dataStore.newTask,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      }

      await dataStore.createTask(newTaskData)
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  return {
    submitNewTask
  }
}
