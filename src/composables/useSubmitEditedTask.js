// // src/composables/useSubmitEditTask.js
import { useTaskStore } from '@/stores/taskStore'
import { formatDate } from '@/utils/dateFormat'
import { validTaskForm } from '@/composables/validationFormRules' // Importar la función de validación
import { useNotificationsStore } from '@/stores/notificationsStore' // Importar para mostrar errores

export function useSubmitEditedTask() {
  const taskStore = useTaskStore()
  const notificationsStore = useNotificationsStore() // Instanciar el store de notificaciones

  const submitEditedTask = async () => {
    try {
      if (!taskStore.editedTask) {
        throw new Error('No task data found for editing.')
      }

      // Validar el formulario antes de continuar
      if (!validTaskForm(taskStore.editedTask)) {
        notificationsStore.displaySnackbar(
          'Please fill all required fields correctly.',
          'warning',
          'mdi-alert-circle'
        )
        return // Detener la ejecución si el formulario no es válido
      }

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
