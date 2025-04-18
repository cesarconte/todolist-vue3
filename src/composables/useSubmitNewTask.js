// src/composables/useSubmitNewTask.js
import { useTaskStore } from '@/stores/taskStore'
import { formatDate } from '@/utils/dateFormat'
import { useProjectStore } from '@/stores/projectStore'
import { validTaskForm } from '@/composables/validationFormRules' // Importar la función de validación
import { useNotificationsStore } from '@/stores/notificationsStore' // Importar para mostrar errores

export function useSubmitNewTask() {
  const taskStore = useTaskStore()
  const projectStore = useProjectStore()
  const notificationsStore = useNotificationsStore() // Instanciar el store de notificaciones

  const submitNewTask = async () => {
    try {
      if (!taskStore.newTask) {
        throw new Error('No task data found. Please reintente abrir el formulario.')
      }

      // Validar el formulario antes de continuar
      if (!validTaskForm(taskStore.newTask)) {
        notificationsStore.displaySnackbar(
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
      // Actualiza el proyecto seleccionado al del formulario si es diferente
      const project = projectStore.projects.find((p) => p.id === newTaskData.projectId)
      if (project) {
        taskStore.setSelectedProject(project.title)
      }
      await taskStore.loadAllUserTasks()
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
      // Remove the form reset call, as the store reset handles it via v-model
      // taskFormRef.value?.reset()
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  return {
    submitNewTask
  }
}
