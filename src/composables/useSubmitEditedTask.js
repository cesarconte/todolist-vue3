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

      await taskStore.updateTask(
        taskStore.editedTask.projectId,
        taskStore.editedTask.id,
        editedTaskData
      )
      taskStore.dialogEditTask = false
    } catch (error) {
      console.error(error)
    }
  }

  return {
    submitEditedTask
  }
}
// useSubmitEditedTask.js
// import { useTaskStore } from '@/stores/taskStore'
// import { useProjectStore } from '@/stores/projectStore'
// export function useSubmitEditedTask() {
//   const taskStore = useTaskStore()
//   const projectStore = useProjectStore()

//   const submitEditedTask = async () => {
//     try {
//       // Obtener el proyecto correspondiente al título seleccionado
//       const project = projectStore.projects.find((p) => p.title === taskStore.editedTask.project)

//       if (!project) {
//         throw new Error('Proyecto no encontrado')
//       }

//       await taskStore.updateTask(
//         project.id, // Usar project.id obtenido del título
//         taskStore.editedTask.id,
//         {
//           ...taskStore.editedTask,
//           projectId: project.id // Actualizar projectId
//         }
//       )
//       taskStore.dialogEditTask = false
//     } catch (error) {
//       console.error('Error al actualizar:', error)
//     }
//   }

//   return { submitEditedTask }
// }
