/**
 * Composable para compartir lógica de formulario de tarea.
 * @module useTaskForm
 */

import { useTaskStore } from '@/stores/taskStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { formatDate } from '@/utils/date/dateFormat'
import { validTaskForm } from '@/composables/forms/validationFormRules'
import { showSnackbar } from '@/utils/notifications/notificationHelpers'
import { getEmptyTask } from '@/composables/tasks/useTaskHelpers'

/**
 * Hook para manejar la lógica compartida de formulario de tarea.
 * @returns {Object} Métodos para crear y actualizar tareas.
 */
export function useTaskForm() {
  const taskStore = useTaskStore()
  const notificationsStore = useNotificationsStore()

  /**
   * Valida el formulario de tarea.
   * @param {Object} taskData - Datos de la tarea a validar.
   * @returns {boolean} True si es válido.
   */
  const validateTaskForm = (taskData) => {
    if (!validTaskForm(taskData)) {
      showSnackbar(
        notificationsStore,
        'Please fill all required fields correctly.',
        'warning',
        'mdi-alert-circle'
      )
      return false
    }
    return true
  }

  /**
   * Formatea las fechas de una tarea.
   * @param {Object} taskData - Datos de la tarea.
   * @returns {Object} Datos con fechas formateadas.
   */
  const formatTaskDates = (taskData) => {
    return {
      ...taskData,
      startDate: formatDate(taskData.startDate),
      endDate: formatDate(taskData.endDate)
    }
  }

  /**
   * Resetea el formulario de nueva tarea.
   */
  const resetNewTaskForm = () => {
    taskStore.newTask = getEmptyTask()
  }

  /**
   * Crea una nueva tarea.
   * @async
   * @param {Object} [taskData] - Datos de la tarea (opcional, usa taskStore.newTask por defecto).
   * @returns {Promise<void>}
   */
  const createTask = async (taskData = null) => {
    const data = taskData || taskStore.newTask

    if (!validateTaskForm(data)) return

    const formattedData = formatTaskDates(data)

    try {
      await taskStore.createTask(formattedData)
      await taskStore.fetchTasks('first')
      resetNewTaskForm()
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  /**
   * Actualiza una tarea existente.
   * @async
   * @param {Object} [taskData] - Datos de la tarea (opcional, usa taskStore.editedTask por defecto).
   * @returns {Promise<void>}
   */
  const updateTask = async (taskData = null) => {
    const data = taskData || taskStore.editedTask

    if (!data || !data.id || !data.projectId) {
      throw new Error('No task data found for editing.')
    }

    if (!validateTaskForm(data)) return

    const formattedData = formatTaskDates(data)

    try {
      await taskStore.updateTask(data.projectId, data.id, formattedData)
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  return {
    createTask,
    updateTask,
    validateTaskForm,
    formatTaskDates,
    resetNewTaskForm
  }
}
