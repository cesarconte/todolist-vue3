// src/composables/useSubmitNewTask.js
import { useTaskStore } from '@/stores/taskStore'
import { formatDate } from '@/utils/dateFormat'
import { useProjectStore } from '@/stores/projectStore'

export function useSubmitNewTask(taskFormRef) {
  const taskStore = useTaskStore()
  const projectStore = useProjectStore()

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
      // Actualiza el proyecto seleccionado al del formulario si es diferente
      const project = projectStore.projects.find((p) => p.id === newTaskData.projectId)
      if (project) {
        taskStore.setSelectedProject(project.title)
      }
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
