// // src/composables/useSubmitEditTask.js
import { useTaskStore } from '@/stores/taskStore'
import { formatDate } from '@/utils/dateFormat'

export function useSubmitEditedTask() {
  const taskStore = useTaskStore()

  const submitEditedTask = async () => {
    try {
      const formattedStartDate = formatDate(taskStore.editedTask.startDate)
      const formattedEndDate = formatDate(taskStore.editedTask.endDate)

      const editedTaskData = {
        ...taskStore.editedTask,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      }

      // Solo llamamos a updateTask, no cerramos el diálogo aquí
      await taskStore.updateTask(
        taskStore.editedTask.projectId,
        taskStore.editedTask.id,
        editedTaskData
      )
      // El cierre del diálogo se gestiona en closeFn (useFormBtnActions)
    } catch (error) {
      console.error(error)
    }
  }

  return {
    submitEditedTask
  }
}
