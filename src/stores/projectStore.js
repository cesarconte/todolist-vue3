// projectStore.js
import { defineStore } from 'pinia'
import { db } from '../firebase.js'
import { ref, computed, watch, reactive } from 'vue'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  getDoc,
  where,
  writeBatch,
  serverTimestamp,
  getDocs
} from 'firebase/firestore'
import { useTaskStore } from './taskStore.js'
import { useUserStore } from './userStore.js'
import { useNotificationsStore } from './notificationsStore.js'
import { useRouter } from 'vue-router'
import { validProjectForm } from '@/composables/validationFormRules.js'
import { getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestoreCrud.js'
import { mapFirestoreProject } from '@/utils/projectMappers.js'
import { requireUserId, showSnackbar, handleError } from '@/utils/notificationHelpers.js'
import { batchDeleteDocuments } from '@/utils/firestoreBatch.js'
import { getEmptyProject, getEmptyEditedProject } from '@/composables/useTaskHelpers.js'
// import { buildProjectQuery } from '@/utils/projectQueries.js'

// Ejemplo de uso futuro (si necesitas paginación o filtrado):
// const q = buildProjectQuery(userId, { title: 'Mi Proyecto', pageSize: 10, lastVisible: someDoc })
// const snapshot = await getDocs(q)
// projectsData.value = snapshot.docs.map(mapFirestoreProject)

export const useProjectStore = defineStore('projects', () => {
  const taskStore = useTaskStore()
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()
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
    console.log('[clearProjectsData] Clearing projectsData')
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
      console.log('[subscribeToCollection] Listener already active')
      return
    }
    console.log('[subscribeToCollection] Subscribing to projects...')
    const collectionRef = query(
      collection(db, 'users', userStore.userId, 'projects'),
      orderBy('title', 'asc')
    )
    listeners.projects = onSnapshot(
      collectionRef,
      (snapshot) => {
        console.log('[onSnapshot] Projects snapshot size:', snapshot.size)
        projectsData.value = snapshot.docs.map((doc) => mapFirestoreProject(doc))
        console.log('[onSnapshot] Current projectsData:', projectsData.value)
      },
      (error) => {
        console.error('Error subscribing to projects:', error)
        showSnackbar(notificationsStore, 'Error fetching projects.', 'error', 'mdi-alert-octagon')
      }
    )
  }

  const unsubscribeAll = () => {
    if (listeners.projects) {
      console.log('[unsubscribeAll] Removing projects listener')
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
        await addDocument(collection(db, 'users', userId, 'projects'), {
          ...newProject,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          projectId: newProject.title.toLowerCase().replace(/\s/g, '-'),
          userId: userId
        })
        showSnackbar(notificationsStore, 'Project created!', 'success', 'mdi-check-circle')
      } else {
        throw new Error('All fields are required.')
      }
    } catch (error) {
      handleError(notificationsStore, 'Error creating project', error)
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
        const projectRef = doc(db, 'users', userId, 'projects', projectId)
        const projectDoc = await getDocument(projectRef)
        const projectData = projectDoc
        if (projectData.userId === userId) {
          await updateDocument(projectRef, {
            ...editedProject,
            updatedAt: serverTimestamp(),
            projectId: editedProject.title.toLowerCase().replace(/\s/g, '-')
          })

          const tasksQuery = query(collection(db, 'users', userId, 'projects', projectId, 'tasks'))
          const tasksSnapshot = await getDocs(tasksQuery)

          const batch = writeBatch(db)

          tasksSnapshot.forEach((taskDoc) => {
            batch.update(taskDoc.ref, { color: editedProject.color })
          })

          await batch.commit()

          showSnackbar(notificationsStore, 'Project updated!', 'success', 'mdi-check-circle')
        } else {
          showSnackbar(
            notificationsStore,
            'You are not authorized to edit this project.',
            'warning',
            'mdi-alert-circle'
          )
        }
      } else {
        throw new Error('All fields are required. Please try again!')
      }
    } catch (error) {
      handleError(notificationsStore, 'Error updating project', error)
    } finally {
      isSaving.value = false
    }
  }

  const deleteAllTasksInProject = async () => {
    try {
      const userId = requireUserId(userStore)
      const projectId = selectedProjectId.value

      if (!projectId) {
        showSnackbar(notificationsStore, 'Project ID is undefined.', 'error', 'mdi-alert-circle')
        return
      }

      const projectRef = doc(db, 'users', userId, 'projects', projectId)
      const projectDoc = await getDoc(projectRef)

      if (!projectDoc.exists() || projectDoc.data().userId !== userId) {
        showSnackbar(
          notificationsStore,
          'Project not found or unauthorized',
          'error',
          'mdi-alert-circle'
        )
        return
      }

      const batch = writeBatch(db)

      const tasksQuery = query(collection(db, 'users', userId, 'projects', projectId, 'tasks'))
      const tasksSnapshot = await getDocs(tasksQuery)

      const taskIds = []
      const notificationsToDelete = []

      for (const taskDoc of tasksSnapshot.docs) {
        const taskId = taskDoc.id
        taskIds.push(taskId)

        const notificationsQuery = query(
          collection(db, 'users', userId, 'notifications'),
          where('taskId', '==', taskId)
        )
        const notificationsSnapshot = await getDocs(notificationsQuery)
        notificationsSnapshot.forEach((doc) => notificationsToDelete.push(doc.ref))

        batch.delete(taskDoc.ref)
      }

      // Eliminar todas las notificaciones encontradas en batch
      await batchDeleteDocuments(db, notificationsToDelete)

      await batch.commit()

      // Limpia las tareas del store relacionadas con el proyecto eliminado
      taskStore.state.tasks = taskStore.state.tasks.filter((task) => task.projectId !== projectId)

      showSnackbar(
        notificationsStore,
        'All tasks deleted successfully',
        'success',
        'mdi-check-circle'
      )
      router.push('/')
    } catch (error) {
      handleError(notificationsStore, 'Error deleting all tasks in project', error)
    }
  }

  const deleteProject = async (projectId) => {
    try {
      const userId = requireUserId(userStore)
      const projectRef = doc(db, 'users', userId, 'projects', projectId)
      const projectDoc = await getDocument(projectRef)

      if (!projectDoc) {
        showSnackbar(
          notificationsStore,
          'Project not found or unauthorized',
          'error',
          'mdi-alert-circle'
        )
        return
      }

      const tasksQuery = query(collection(db, 'users', userId, 'projects', projectId, 'tasks'))
      const tasksSnapshot = await getDocs(tasksQuery)
      const batch = writeBatch(db)
      const notificationsToDeleteRefs = []

      for (const taskDoc of tasksSnapshot.docs) {
        const taskId = taskDoc.id
        batch.delete(taskDoc.ref)

        const notificationsQuery = query(
          collection(db, 'users', userId, 'notifications'),
          where('taskId', '==', taskId)
        )
        const notificationsSnapshot = await getDocs(notificationsQuery)
        notificationsSnapshot.forEach((notificationDoc) => {
          notificationsToDeleteRefs.push(notificationDoc.ref)
        })
      }

      await batchDeleteDocuments(db, notificationsToDeleteRefs)
      await batch.commit()

      await deleteDocument(projectRef)

      showSnackbar(
        notificationsStore,
        'Project, its tasks, and related notifications deleted successfully',
        'success',
        'mdi-check-circle'
      )

      if (selectedProjectId.value === projectId) {
        selectedProjectId.value = null
      }
      router.push('/')
    } catch (error) {
      handleError(notificationsStore, 'Error deleting project', error)
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
      console.log('[watch userId] newUserId:', newUserId)
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
    batchDeleteDocuments,
    getEmptyProject,
    getEmptyEditedProject,
    mapFirestoreProject
  }
})
