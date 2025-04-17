import { useProjectStore } from '@/stores/projectStore'
import { useNotificationsStore } from '@/stores/notificationsStore'

export function useAddNewProject(resetAddProjectFormFn, dialogAddProject, drawer) {
  const projectStore = useProjectStore()
  const notificationsStore = useNotificationsStore()

  const addNewProject = async () => {
    try {
      await projectStore.createProject(projectStore.newProject)
      resetAddProjectFormFn()
      dialogAddProject.value = false
      drawer.value = false
      notificationsStore.showSnackbar(
        `Project ${projectStore.newProject.title} added successfully!`,
        'success',
        'mdi-check-circle-outline'
      )
    } catch (error) {
      notificationsStore.showSnackbar(
        'An error occurred while adding the project.',
        'error',
        'mdi-alert-circle-outline'
      )
    }
  }

  return { addNewProject }
}
