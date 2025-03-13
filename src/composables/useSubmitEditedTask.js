// src/composables/useSubmitEditTask.js

import { useDataStore } from '@/stores/dataStore'
import { useTaskStore } from '@/stores/taskStore'
import { formatDate } from '@/utils/dateFormat'

export function useSubmitEditedTask() {
  const dataStore = useDataStore()
  const taskStore = useTaskStore()

  const submitEditedTask = async () => {
    try {
      const formattedStartDate = formatDate(dataStore.editedTask.startDate)
      const formattedEndDate = formatDate(dataStore.editedTask.endDate)

      const editedTaskData = {
        ...dataStore.editedTask,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      }

      await dataStore.updateTask(dataStore.editedTask.id, editedTaskData)
      taskStore.dialogEditTask = false
    } catch (error) {
      console.error(error)
    }
  }

  return {
    submitEditedTask
  }
}
