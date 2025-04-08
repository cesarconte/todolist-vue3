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
  addDoc,
  updateDoc,
  deleteDoc,
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

export const useProjectStore = defineStore('projects', () => {
  const taskStore = useTaskStore()
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()
  const router = useRouter()

  // State
  const projectsData = ref([])
  const newProject = reactive({
    color: '',
    createdAt: '',
    icon: '',
    projectId: '',
    title: '',
    userId: ''
  })
  const editedProject = reactive({
    title: '',
    icon: '',
    color: ''
  })
  const isSaving = ref(false)
  const listeners = ref({
    projects: null,
    projectTemplates: null
  })

  // Getters
  const projects = computed(() => projectsData.value)
  const projectItems = computed(() =>
    projectsData.value.map((project) => ({ value: project.title, title: project.title }))
  )
  const selectedProject = computed(() => taskStore.selectedProject)
  const selectedProjectId = computed(() => {
    const project = projects.value.find((project) => project.title === selectedProject.value)
    return project?.id || ''
  })
  const newProjectData = computed(() => newProject)
  const editedProjectData = computed(() => editedProject)

  // Actions
  const clearProjectsData = () => {
    // Limpia los datos reactivos
    projectsData.value = []
    Object.assign(newProject, {
      color: '',
      createdAt: '',
      icon: '',
      projectId: '',
      title: '',
      userId: ''
    })
    Object.assign(editedProject, {
      title: '',
      icon: '',
      color: ''
    })
  }

  // const subscribeToCollection = (collectionName, targetRef) => {
  //   const collectionRef = query(
  //     collection(db, 'users', userStore.userId, collectionName),
  //     orderBy('title', 'asc')
  //   )
  //   listeners.value[collectionName] = onSnapshot(collectionRef, (snapshot) => {
  //     snapshot.docChanges().forEach((change) => {
  //       const index = targetRef.value.findIndex((item) => item.id === change.doc.id)
  //       switch (change.type) {
  //         case 'added':
  //           if (index === -1) targetRef.value.push({ id: change.doc.id, ...change.doc.data() })
  //           break
  //         case 'modified':
  //           if (index !== -1)
  //             targetRef.value.splice(index, 1, { id: change.doc.id, ...change.doc.data() })
  //           break
  //         case 'removed':
  //           if (index !== -1) targetRef.value.splice(index, 1)
  //           break
  //       }
  //     })
  //   })
  // }
  const subscribeToCollection = () => {
    // if (!userStore.isLoggedIn) {
    //   console.warn('Not subscribed to projects as user is not logged in.')
    //   return
    // }
    if (!userStore.userId) {
      console.warn('Not subscribed to projects. User ID not available')
      return
    }

    const collectionRef = query(
      collection(db, 'users', userStore.userId, 'projects'),
      orderBy('title', 'asc')
    )

    listeners.value.projects = onSnapshot(
      collectionRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const index = projectsData.value.findIndex((item) => item.id === change.doc.id)
          switch (change.type) {
            case 'added':
              if (index === -1) projectsData.value.push({ id: change.doc.id, ...change.doc.data() })
              break
            case 'modified':
              if (index !== -1)
                projectsData.value.splice(index, 1, { id: change.doc.id, ...change.doc.data() })
              break
            case 'removed':
              if (index !== -1) projectsData.value.splice(index, 1)
              break
          }
        })
      },
      (error) => {
        console.error('Error subscribing to projects:', error)
        notificationsStore.displaySnackbar('Error fetching projects.', 'error', 'mdi-alert-octagon')
      }
    )
  }

  const createProject = async (newProject) => {
    if (!userStore.isLoggedIn) {
      notificationsStore.displaySnackbar(
        'Please log in to create a project.',
        'error',
        'mdi-account-off'
      )
      return // Stop execution if not logged in
    }
    if (isSaving.value) return
    isSaving.value = true

    try {
      if (validProjectForm(newProject)) {
        await addDoc(collection(db, 'users', userStore.userId, 'projects'), {
          ...newProject,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          projectId: newProject.title.toLowerCase().replace(/\s/g, '-'),
          userId: userStore.userId
          // createdBy: userStore.userId
        })
        notificationsStore.displaySnackbar('Project created!', 'success', 'mdi-check-circle')
      } else {
        // Display an error message
        throw new Error('All fields are required.')
      }
    } catch (error) {
      notificationsStore.displaySnackbar(error.message, 'error', 'mdi-close-circle')
    } finally {
      isSaving.value = false
    }
  }

  const saveEditedProject = async (projectId, editedProject) => {
    // Check if a user is logged in
    if (!userStore.isLoggedIn) {
      notificationsStore.displaySnackbar(
        'Please log in to edit a project.',
        'error',
        'mdi-account-off'
      )
      return // Stop execution if not logged in
    }

    // Check if the project is being edited
    if (isSaving.value) return
    isSaving.value = true
    try {
      // Check if all fields are filled
      if (validProjectForm(editedProject)) {
        // Fetch the project from Firestore to check ownership
        const projectRef = doc(db, 'users', userStore.userId, 'projects', projectId)
        const projectDoc = await getDoc(projectRef)
        const projectData = projectDoc.data()

        // Check if the user owns the project
        if (projectData.createdBy === userStore.userId) {
          // Update the project in Firestore
          await updateDoc(projectRef, {
            ...editedProject,
            updatedAt: serverTimestamp(),
            projectId: editedProject.title.toLowerCase().replace(/\s/g, '-')
          })
          // Display a success message
          notificationsStore.displaySnackbar('Project updated!', 'success', 'mdi-check-circle')
        } else {
          // Handle unauthorized access (e.g., show an error message)
          notificationsStore.displaySnackbar(
            'You are not authorized to edit this project.',
            'warning',
            'mdi-alert-circle'
          )
        }
      } else {
        // Display an error message
        throw new Error('All fields are required. Please try again!')
      }
    } catch (error) {
      // Display an error message
      notificationsStore.displaySnackbar(
        'Error updating project: ' + error.message + ' Please try again!',
        'error',
        'mdi-close-circle'
      )
    } finally {
      // Reset isSaving flag
      isSaving.value = false
    }
  }

  const deleteAllTasksInProject = async () => {
    try {
      // Verificar autenticación
      if (!userStore.isLoggedIn) {
        notificationsStore.displaySnackbar(
          'Please log in to delete tasks.',
          'error',
          'mdi-account-off'
        )
        return
      }

      const currentUserId = userStore.userId
      const projectId = selectedProjectId.value

      // Obtener referencia del proyecto
      const projectRef = doc(db, 'users', currentUserId, 'projects', projectId)
      const projectDoc = await getDoc(projectRef)

      if (!projectDoc.exists() || projectDoc.data().userId !== currentUserId) {
        notificationsStore.displaySnackbar(
          'Project not found or unauthorized',
          'error',
          'mdi-alert-circle'
        )
        return
      }

      // Crear batch para operaciones atómicas
      const batch = writeBatch(db)

      // 1. Obtener todas las tareas del proyecto
      const tasksQuery = query(
        collection(db, 'users', currentUserId, 'tasks'),
        where('projectId', '==', projectId)
      )
      const tasksSnapshot = await getDocs(tasksQuery)

      // 2. Colectar IDs de tareas y notificaciones
      const taskIds = []
      const notificationsToDelete = []

      // Procesar cada tarea
      for (const taskDoc of tasksSnapshot.docs) {
        const taskId = taskDoc.id
        taskIds.push(taskId)

        // 3. Buscar notificaciones relacionadas
        const notificationsQuery = query(
          collection(db, 'users', currentUserId, 'notifications'),
          where('taskId', '==', taskId)
        )
        const notificationsSnapshot = await getDocs(notificationsQuery)
        notificationsSnapshot.forEach((doc) => notificationsToDelete.push(doc.ref))

        // 4. Eliminar tarea y actualizar usuario
        // batch.delete(taskDoc.ref)
        // batch.update(doc(db, 'users', currentUserId), {
        //   createdTasks: arrayRemove(taskId)
        // })
        batch.delete(doc(db, 'users', currentUserId, 'projects', projectId, 'tasks', taskId))
      }

      // 5. Eliminar todas las notificaciones encontradas
      notificationsToDelete.forEach((ref) => batch.delete(ref))

      // Ejecutar batch atómico
      await batch.commit()

      // 6. Limpiar estado y notificar
      notificationsStore.displaySnackbar(
        'All tasks deleted successfully',
        'success',
        'mdi-check-circle'
      )
      router.push('/')
    } catch (error) {
      notificationsStore.displaySnackbar(`Error: ${error.message}`, 'error', 'mdi-close-circle')
    }
  }

  // const deleteProject = async (projectId) => {
  //   try {
  //     // Check if a user is logged in
  //     if (!userStore.isLoggedIn) {
  //       console.error('User must be logged in to delete a project.')
  //       notificationsStore.displaySnackbar(
  //         'Please log in to delete a project.',
  //         'error',
  //         'mdi-account-off'
  //       )
  //       return // Stop execution if not logged in
  //     }

  //     const currentUserId = userStore.userId
  //     // Fetch the project from Firestore to check ownership
  //     const projectRef = doc(db, 'users', currentUserId, 'projects', projectId)
  //     const projectDoc = await getDoc(projectRef)
  //     const projectData = projectDoc.data()

  //     // Check if the user owns the project
  //     if (projectData.userId === userStore.userId) {
  //       // Delete all tasks in the project
  //       await deleteAllTasksInProject(projectId)

  //       // Delete the project from Firestore
  //       await deleteDoc(projectRef)

  //       // Display a success message
  //       notificationsStore.displaySnackbar(
  //         'Project deleted successfully',
  //         'success',
  //         'mdi-check-circle'
  //       )

  //       // Update taskStore.selectedProject if it matches the deleted project
  //       if (selectedProject.value === projectId) {
  //         selectedProject.value = null
  //       }

  //       // Redirect to '/' after deleting the project
  //       router.push('/')
  //     } else {
  //       // Handle unauthorized access (e.g., show an error message)
  //       console.error('Unauthorized access to project:', projectId)
  //       notificationsStore.displaySnackbar(
  //         'You are not authorized to delete this project.',
  //         'warning',
  //         'mdi-alert-circle'
  //       )
  //     }
  //   } catch (error) {
  //     // Display an error message
  //     console.error('Error deleting project:', error)
  //     notificationsStore.displaySnackbar(
  //       'Error deleting project: ' + error.message + ' Please try again!',
  //       'error',
  //       'mdi-close-circle'
  //     )
  //   }
  // }
  const deleteProject = async (projectId) => {
    try {
      if (!userStore.isLoggedIn) {
        console.error('User must be logged in to delete a project.')
        notificationsStore.displaySnackbar(
          'Please log in to delete a project.',
          'error',
          'mdi-account-off'
        )
        return
      }

      const currentUserId = userStore.userId
      const projectRef = doc(db, 'users', currentUserId, 'projects', projectId) // Changed here
      const projectDoc = await getDoc(projectRef)

      if (!projectDoc.exists()) {
        notificationsStore.displaySnackbar(
          'Project not found or unauthorized',
          'error',
          'mdi-alert-circle'
        )
        return
      }

      // Check if the user owns the project (implicitly by being in their subcollection)

      // 1. Delete all tasks within the project
      const tasksQuery = query(
        collection(db, 'users', currentUserId, 'projects', projectId, 'tasks') // Changed here
      )
      const tasksSnapshot = await getDocs(tasksQuery)
      const batch = writeBatch(db)
      tasksSnapshot.forEach((doc) => {
        batch.delete(doc.ref)
      })
      await batch.commit()

      // 2. Delete the project document
      await deleteDoc(projectRef)

      notificationsStore.displaySnackbar(
        'Project and its tasks deleted successfully',
        'success',
        'mdi-check-circle'
      )

      if (selectedProject.value === projectId) {
        selectedProject.value = null
      }
      router.push('/')
    } catch (error) {
      console.error('Error deleting project:', error)
      notificationsStore.displaySnackbar(
        'Error deleting project: ' + error.message + ' Please try again!',
        'error',
        'mdi-close-circle'
      )
    }
  }

  // Lifecycle
  // onMounted(() => {
  //   // Check if a user is logged in
  //   if (!userStore.isLoggedIn) {
  //     console.warn('User is not logged in. Not subscribing to projects.')
  //     return
  //   }
  //   // Subscribe to the projects collection
  //   subscribeToCollection('projects', projectsData)
  // })

  // onUnmounted(() => {
  //   Object.values(listeners.value).forEach((unsubscribe) => unsubscribe?.())
  //   clearProjectsData()
  // })
  // onUnmounted(() => {
  //   listeners.value.projects?.() // Unsubscribe only the projects listener
  //   clearProjectsData()
  // })
  watch(
    () => userStore.userId,
    (newUserId) => {
      if (newUserId) {
        subscribeToCollection()
      } else {
        listeners.value.projects?.()
        clearProjectsData()
      }
    },
    { immediate: true }
  )

  return {
    // State
    projectsData,
    newProject,
    editedProject,
    projects,
    projectItems,
    selectedProjectId,
    newProjectData,
    editedProjectData,
    // Getters
    selectedProject,
    // Reactive properties
    isSaving,
    listeners,
    // Helpers
    subscribeToCollection,
    // Validations
    validProjectForm,
    // Actions
    clearProjectsData,
    createProject,
    saveEditedProject,
    deleteProject,
    deleteAllTasksInProject
  }
})
