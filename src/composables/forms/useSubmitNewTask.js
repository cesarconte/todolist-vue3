// src/composables/useSubmitNewTask.js
import { useTaskStore } from '@/stores/taskStore'
import { formatDate } from '@/utils/date/dateFormat'
import { validTaskForm } from '@/composables/forms/validationFormRules' // Importar la función de validación
import { useNotificationsStore } from '@/stores/notificationsStore' // Importar para mostrar errores
import { showSnackbar } from '@/utils/notifications/notificationHelpers.js' // Import the helper

export function useSubmitNewTask() {
  const taskStore = useTaskStore()
  const notificationsStore = useNotificationsStore() // Instanciar el store de notificaciones

  const submitNewTask = async () => {
    try {
      if (!taskStore.newTask) {
        throw new Error('No task data found. Please reintente abrir el formulario.')
      }

      // Validar el formulario antes de continuar
      if (!validTaskForm(taskStore.newTask)) {
        // Use the centralized helper function
        showSnackbar(
          notificationsStore,
          'Please fill all required fields correctly.',
          'warning',
          'mdi-alert-circle'
        )
        return // Detener la ejecución si el formulario no es válido
      }

      const formattedStartDate = formatDate(taskStore.newTask.startDate)
      const formattedEndDate = formatDate(taskStore.newTask.endDate)

      const newTaskData = {
        ...taskStore.newTask,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      }

      await taskStore.createTask(newTaskData)
      // Recarga la lista filtrada y paginada
      await taskStore.fetchTasks('first')
      // Reset the newTask object in the store directamente
      taskStore.newTask = {
        projectId: '',
        title: '',
        description: '',
        label: null,
        priority: null,
        status: null,
        startDate: null,
        endDate: null,
        startDateHour: '',
        endDateHour: '',
        completed: false,
        color: null
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  return {
    submitNewTask
  }
}
