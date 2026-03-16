// projectStore.js
import { defineStore } from 'pinia'
import { ref, computed, watch, reactive } from 'vue'
import { useTaskStore } from './taskStore.js'
import { useUserStore } from './userStore.js'
import { useRouter } from 'vue-router'
import { validProjectForm } from '@/composables/forms/validationFormRules.js'
import {
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument
} from '@/utils/firestore/firestoreCrud.js'
import { mapFirestoreProject } from '@/utils/projects/projectMappers.js'
import {
  requireUserId,
  showSnackbar,
  handleError
} from '@/utils/notifications/notificationHelpers.js'
import { getEmptyProject, getEmptyEditedProject } from '@/composables/tasks/useTaskHelpers.js'
import * as projectService from '@/services/projectService.js'
import { useNotificationsStore } from './notificationsStore.js'
// import { buildProjectQuery } from '@/utils/projectQueries.js'

// Ejemplo de uso futuro (si necesitas paginación o filtrado):
// const q = buildProjectQuery(userId, { title: 'Mi Proyecto', pageSize: 10, lastVisible: someDoc })
// const snapshot = await getDocs(q)
// projectsData.value = snapshot.docs.map(mapFirestoreProject)

export const useProjectStore = defineStore('projects', () => {
  const taskStore = useTaskStore()
  const userStore = useUserStore()
  const router = useRouter()

  // State
  const projectsData = ref([])
  const newProject = reactive(getEmptyProject())
  const editedProject = reactive(getEmptyEditedProject())
  const isSaving = ref(false)
  const listeners = reactive({
    projects: null
  })
  const selectedProjectId = ref(null) // Ahora el id es el valor principal

  // Getters
  const projects = computed(() => projectsData.value)
  const projectItems = computed(() =>
    projectsData.value.map((project) => ({ value: project.id, title: project.title }))
  )
  const selectedProject = computed(() => {
    // Devuelve el objeto proyecto seleccionado o null
    return projects.value.find((project) => project.id === selectedProjectId.value) || null
  })
  const selectedProjectTitle = computed(() =>
    selectedProject.value ? selectedProject.value.title : ''
  )
  const newProjectData = computed(() => newProject)
  const editedProjectData = computed(() => editedProject)

  // Actions
  const clearProjectsData = () => {
    projectsData.value = []
    Object.assign(newProject, getEmptyProject())
    Object.assign(editedProject, getEmptyEditedProject())
    selectedProjectId.value = null
  }

  const subscribeToCollection = () => {
    if (!userStore.userId) {
      console.warn('[subscribeToCollection] Not subscribed: userId not available')
      return
    }
    if (listeners.projects) {
      return
    }
    listeners.projects = projectService.subscribeToProjects(userStore.userId, (projects) => {
      projectsData.value = projects
    })
  }

  const unsubscribeAll = () => {
    if (listeners.projects) {
      listeners.projects()
      listeners.projects = null
    }
  }

  const createProject = async (newProject) => {
    try {
      const userId = requireUserId(userStore)
      if (isSaving.value) return
      isSaving.value = true
      if (validProjectForm(newProject)) {
        await projectService.createProject(userId, newProject)
      } else {
        throw new Error('All fields are required.')
      }
    } catch (error) {
      handleError(useNotificationsStore(), 'Error creating project', error)
    } finally {
      isSaving.value = false
    }
  }

  const saveEditedProject = async (projectId, editedProject) => {
    try {
      const userId = requireUserId(userStore)
      if (isSaving.value) return
      isSaving.value = true
      if (validProjectForm(editedProject)) {
        await projectService.updateProject(userId, projectId, editedProject)
      } else {
        throw new Error('All fields are required. Please try again!')
      }
    } catch (error) {
      handleError(useNotificationsStore(), 'Error updating project', error)
    } finally {
      isSaving.value = false
    }
  }

  const deleteAllTasksInProject = async () => {
    try {
      const userId = requireUserId(userStore)
      const projectId = selectedProjectId.value

      if (!projectId) {
        showSnackbar(
          useNotificationsStore(),
          'Project ID is undefined.',
          'error',
          'mdi-alert-circle'
        )
        return
      }

      await projectService.deleteAllTasksInProject(userId, projectId)

      // Limpia las tareas del store relacionadas con el proyecto eliminado
      taskStore.state.tasks = taskStore.state.tasks.filter((task) => task.projectId !== projectId)
      router.push('/')
    } catch (error) {
      handleError(useNotificationsStore(), 'Error deleting all tasks in project', error)
    }
  }

  const deleteProject = async (projectId) => {
    try {
      const userId = requireUserId(userStore)
      await projectService.deleteProject(userId, projectId)

      if (selectedProjectId.value === projectId) {
        selectedProjectId.value = null
      }
      router.push('/')
    } catch (error) {
      handleError(useNotificationsStore(), 'Error deleting project', error)
    }
  }

  const getProjectById = (id) => {
    return projectsData.value.find((project) => project.id === id) || null
  }

  const setSelectedProject = (projectId) => {
    selectedProjectId.value = projectId || null
  }

  // Watchers
  watch(
    () => userStore.userId,
    (newUserId) => {
      if (newUserId) {
        subscribeToCollection()
      } else {
        unsubscribeAll()
        clearProjectsData()
      }
    },
    { immediate: true }
  )

  return {
    projectsData,
    newProject,
    editedProject,
    projects,
    projectItems,
    selectedProjectId,
    newProjectData,
    editedProjectData,
    selectedProject, // computed objeto
    selectedProjectTitle, // computed string
    isSaving,
    listeners,
    subscribeToCollection,
    unsubscribeAll,
    validProjectForm,
    clearProjectsData,
    createProject,
    saveEditedProject,
    deleteProject,
    deleteAllTasksInProject,
    getProjectById,
    setSelectedProject,
    showSnackbar,
    handleError,
    requireUserId,
    getDocument,
    addDocument,
    updateDocument,
    deleteDocument,
    getEmptyProject,
    getEmptyEditedProject,
    mapFirestoreProject
  }
})
