import { useProjectStore } from '@/stores/projectStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { showSnackbar } from '@/utils/notificationHelpers.js' // Import the helper

// Changed the third parameter from 'drawer' to 'closeDrawerCallback' (a function)
export function useAddNewProject(resetAddProjectFormFn, dialogAddProject, closeDrawerCallback) {
  const projectStore = useProjectStore()
  const notificationsStore = useNotificationsStore()

  const addNewProject = async () => {
    try {
      await projectStore.createProject(projectStore.newProject)
      resetAddProjectFormFn()
      dialogAddProject.value = false

      // Call the provided callback function to close the drawer
      if (typeof closeDrawerCallback === 'function') {
        closeDrawerCallback()
      } else {
        console.error('closeDrawerCallback is not a function:', closeDrawerCallback)
      }

      // Use the centralized helper function
      showSnackbar(
        notificationsStore,
        `Project ${projectStore.newProject.title} added successfully!`,
        'success',
        'mdi-check-circle-outline'
      )
    } catch (error) {
      console.error('Error in addNewProject:', error)
      // Use the centralized helper function
      showSnackbar(
        notificationsStore,
        'An error occurred while adding the project.',
        'error',
        'mdi-alert-circle-outline'
      )
    }
  }

  return { addNewProject }
}
