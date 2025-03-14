//dataStore.js

import { defineStore } from 'pinia'
import { db } from '../firebase.js'
import { ref, onMounted, computed, onUnmounted, reactive, watch } from 'vue'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  getDoc,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
  arrayUnion,
  arrayRemove,
  runTransaction,
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import { useTaskStore } from './taskStore.js'
import { useUserStore } from './userStore.js'
import { useNotificationsStore } from './notificationsStore.js'
import { useRouter } from 'vue-router'
import { validTaskForm } from '@/composables/validationFormRules.js'
import { validProjectForm } from '@/composables/validationFormRules.js'

export const useDataStore = defineStore('data', () => {
  const taskStore = useTaskStore()
  const userStore = useUserStore()
  const router = useRouter()
  // State
  const userData = ref([])
  const tasksData = ref([])
  const projectsData = ref([])
  const projectTemplatesData = ref([])
  const labelsData = ref([])
  const prioritiesData = ref([])
  const statusesData = ref([])
  const colorsData = ref([])
  const iconsData = ref([])
  const newTask = ref({
    title: '',
    description: '',
    project: '',
    label: '',
    priority: '',
    status: '',
    startDate: null,
    startDateHour: null,
    endDate: null,
    endDateHour: null,
    completed: false,
    createdAt: null,
    createdBy: '',
    projectId: ''
  })
  const editedTask = reactive({
    title: '',
    description: '',
    project: '',
    label: '',
    priority: '',
    status: '',
    startDate: null,
    startDateHour: null,
    endDate: null,
    endDateHour: null,
    updatedAt: serverTimestamp()
  })
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
  // Listeners (store unsubscribe functions for each collection)
  const listeners = ref({
    tasks: null,
    projects: null,
    projectTemplates: null,
    labels: null,
    priorities: null,
    statuses: null,
    colors: null,
    icons: null
  })

  // Getters (computed properties for reactive data access)
  const tasks = computed(() => {
    return tasksData.value
  })
  const projects = computed(() => {
    return projectsData.value
  })
  const projectTemplates = computed(() => {
    return projectTemplatesData.value
  })
  const labels = computed(() => {
    return labelsData.value
  })
  const priorities = computed(() => {
    return prioritiesData.value
  })
  const statuses = computed(() => {
    return statusesData.value
  })
  const colors = computed(() => {
    return colorsData.value
  })
  const icons = computed(() => {
    return iconsData.value
  })
  const newTaskData = computed(() => {
    return newTask.value
  })
  const editedTaskData = computed(() => {
    return editedTask
  })
  const newProjectData = computed(() => {
    return newProject
  })
  const editedProjectData = computed(() => {
    return editedProject
  })
  const selectedProject = computed(() => {
    return taskStore.selectedProject
  })
  const selectedProjectId = computed(() => {
    const project = projects.value.find((project) => project.title === selectedProject.value)
    const projectId = project?.id || ''
    return projectId
  })
  const newTaskProjectId = computed(() => {
    const project = projects.value.find((project) => project.title === newTask.value.project)
    const projectId = project ? project.id : null
    return projectId
  })
  const projectItems = computed(() => {
    return projectsData.value.map((project) => ({
      value: project.title,
      title: project.title
    }))
  })
  const projectTemplateItems = computed(() => {
    return projectTemplatesData.value.map((projectTemplate) => ({
      value: projectTemplate.title,
      title: projectTemplate.title
    }))
  })
  const labelItems = computed(() => {
    return labelsData.value.map((label) => ({
      value: label.title,
      title: label.title
    }))
  })
  const priorityItems = computed(() => {
    return prioritiesData.value.map((priority) => ({
      value: priority.title,
      title: priority.title
    }))
  })
  const statusItems = computed(() => {
    return statusesData.value.map((status) => ({
      value: status.title,
      title: status.title
    }))
  })
  const colorItems = computed(() => {
    return colorsData.value.map((color) => ({
      value: color.title,
      title: color.title
    }))
  })
  const iconItems = computed(() => {
    return iconsData.value.map((icon) => ({
      value: icon.title,
      title: icon.displayName
    }))
  })

  // Actions

  // Fetch data for a collection, optionally filtering and unsubscribing after initial fetch
  const fetchCollection = async (collectionName, targetRef) => {
    subscribeToCollection(collectionName, targetRef, true)
  }

  const subscribeToCollection = (collectionName, targetRef) => {
    // Creamos una consulta a la colección especificada, ordenando los documentos por el campo
    // 'title' en orden ascendente.
    const collectionRef = query(collection(db, collectionName), orderBy('title', 'asc'))
    // Utilizamos onSnapshot para subscribirse a la colección.
    listeners.value[collectionName] = onSnapshot(collectionRef, (snapshot) => {
      try {
        if (!targetRef.value) {
          targetRef.value = []
        }
        // * Utilizamos docChanges() para obtener sólo los cambios en los documentos, lo que supone
        // una mejora en el rendimiento.
        // * Se itera sobre los cambios y se actualizan los arrays reactivos correspondientes
        // (added, modified, removed).
        snapshot.docChanges().forEach((change) => {
          const index = targetRef.value.findIndex((item) => item.id === change.doc.id)
          switch (change.type) {
            case 'added':
              // Check for duplicates before adding
              if (index === -1) {
                // Add the new document to the array
                targetRef.value.push({
                  id: change.doc.id,
                  ...change.doc.data()
                })
              }
              break
            case 'modified':
              if (index !== -1) {
                // Update the existing document in the array
                targetRef.value.splice(index, 1, {
                  id: change.doc.id,
                  ...change.doc.data()
                })
              }
              break
            case 'removed':
              //if (index !== -1) {
              // Remove the document from the array
              targetRef.value.splice(index, 1) // No need to check for index here
              //}
              break
          }
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        alert('Error fetching data')
      }
    })
  }

  // Get a single task from Firestore
  const getTask = async (taskId) => {
    try {
      const taskRef = doc(db, 'tasks', taskId)
      const taskDoc = await getDoc(taskRef)

      if (taskDoc.exists()) {
        const taskData = taskDoc.data()

        // Convert startDate and endDate to Date objects if they are Timestamps
        if (taskData.startDate instanceof Timestamp) {
          taskData.startDate = taskData.startDate.toDate()
        }
        if (taskData.endDate instanceof Timestamp) {
          taskData.endDate = taskData.endDate.toDate()
        }

        return {
          id: taskDoc.id,
          ...taskData
        }
      } else {
        // Handle the case where the task doesn't exist
        console.error('Task not found:', taskId)
        return null
      }
    } catch (error) {
      console.error('Error getting task:', error)
      return null
    }
  }

  // Create a new task in Firestore
  const createTask = async (newTask) => {
    // Check if a user is logged in
    if (!userStore.isLoggedIn) {
      console.error('User must be logged in to edit a task.')
      alert('Please log in to edit a task.')
      return // Stop execution if not logged in
    }
    // Check if the user ID is defined
    if (!userStore.userId) {
      console.error('User ID is undefined. Please log in.')
      alert('User ID is undefined. Please log in.')
      return // Stop execution if user ID is undefined
    }
    // Check if the task is being created
    if (isSaving.value) {
      return // Prevent multiple submissions
    }
    isSaving.value = true
    try {
      // Check if all fields are filled
      if (validTaskForm(newTask)) {
        // Get the project color
        const projectColor = await taskStore.getProjectColor(newTask.project)
        const projectId = newTaskProjectId.value
        // Combine the date and time for the end date
        const endDate = newTask.endDate
        const [hours, minutes] = newTask.endDateHour.split(':').map(Number)
        const endDateFormatted = new Date(endDate)
        endDateFormatted.setHours(hours, minutes, 0, 0)
        // Combine the date and time for the start date
        const startDate = newTask.startDate
        const [startHours, startMinutes] = newTask.startDateHour.split(':').map(Number)
        const startDateFormatted = new Date(startDate)
        startDateFormatted.setHours(startHours, startMinutes, 0, 0)
        // Add the task to Firestore
        const taskDocRef = await addDoc(collection(db, 'tasks'), {
          ...newTask,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          createdAt: new Date(),
          updatedAt: new Date(),
          completed: false,
          color: projectColor,
          taskId: newTask.title.toLowerCase().replace(/ /g, '-'),
          createdBy: userStore.userId,
          projectId: projectId
        })
        // Get the taskId from the newly created document
        const taskId = taskDocRef.id

        // Update the user document with the taskId
        const userRef = doc(db, 'users', userStore.userId)
        await updateDoc(userRef, {
          createdTasks: arrayUnion(taskId) // Add the taskId to the array
        })
        // Display a success message
        alert('Task created successfully')
        // Display a success message
      } else {
        // Display an error message
        throw new Error('All fields are required.')
      }
    } catch (error) {
      console.error('createTask: Error creating task:', error) // Imprime el error en la consola
      alert('An error occurred while creating the task. Please try again.')
    } finally {
      // Reset isSaving flag
      isSaving.value = false
    }
  }

  // Edit an existing task in Firestore
  const updateTask = async (taskId, editedTask) => {
    // Check if a user is logged in
    if (!userStore.isLoggedIn) {
      console.error('User must be logged in to edit a task.')
      alert('Please log in to edit a task.')
      return // Stop execution if not logged in
    }

    // Check if the task is being edited
    if (isSaving.value) {
      return
    }
    isSaving.value = true

    try {
      // Check if all fields are filled
      if (validTaskForm(editedTask) && editedTask.startDate <= editedTask.endDate) {
        // Get the project color
        const projectColor = await taskStore.getProjectColor(editedTask.project)
        const taskRef = doc(db, 'tasks', taskId)

        // Fetch the task from Firestore to check ownership
        const taskDoc = await getDoc(taskRef)
        const taskData = taskDoc.data()
        // const startDate = taskData.startDate

        // Check if the user owns the task
        if (taskData.createdBy === userStore.userId) {
          const isCompleted = editedTask.status === 'Done'

          // Combine the date and time for the start date
          // const startDate = new Date(editedTask.startDate)
          const startDate = editedTask.startDate
          const [startHours, startMinutes] = editedTask.startDateHour.split(':').map(Number)
          const startDateFormatted = new Date(startDate)
          startDateFormatted.setHours(startHours, startMinutes, 0, 0)
          // Combine the date and time for the end date
          const endDate = editedTask.endDate
          const [hours, minutes] = editedTask.endDateHour.split(':').map(Number)
          const endDateFormatted = new Date(endDate)
          endDateFormatted.setHours(hours, minutes, 0, 0)

          // Update the task in Firestore
          await updateDoc(taskRef, {
            ...editedTask,
            completed: isCompleted,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            updatedAt: new Date(),
            color: projectColor
          })

          // Display a success message
          alert('Task updated successfully')
        } else {
          // Handle unauthorized access (e.g., show an error message)
          console.error('Unauthorized access to task:', taskId)
          alert('You are not authorized to edit this task.')
        }
      } else {
        // Display an error message
        throw new Error('All fields are required. Please try again!')
      }
    } catch (error) {
      // Display an error message
      console.error('Error updating task:', error)
      alert(error.message || 'An error occurred while updating the task. Please try again.')
    } finally {
      // Reset isSaving flag
      isSaving.value = false
    }
  }

  // Delete a task from Firestore
  const deleteTask = async (taskId) => {
    try {
      // Check if a user is logged in
      if (!userStore.isLoggedIn) {
        console.error('User must be logged in to delete a task.')
        alert('Please log in to delete a task.')
        return // Stop execution if not logged in
      }

      // Fetch the task from Firestore to check ownership
      const taskRef = doc(db, 'tasks', taskId)
      const taskDoc = await getDoc(taskRef)
      const taskData = taskDoc.data()

      // Check if the user owns the task
      if (taskData.createdBy === userStore.userId) {
        // 1. Get the user's document reference
        const userRef = doc(db, 'users', userStore.userId)

        // 2. Update the user document to remove the taskId from createdTasks
        try {
          await updateDoc(userRef, {
            createdTasks: arrayRemove(taskId) // Use arrayRemove to delete specific element
          })
        } catch (updateError) {
          console.error('Error updating user document:', updateError)
        }

        // 3. Delete the task from Firestore
        await deleteDoc(taskRef)

        // 4. Delete notifications
        const notificationsRef = collection(db, 'users', userStore.userId, 'notifications')
        const q = query(notificationsRef, where('taskId', '==', taskId))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const batch = writeBatch(db)
          querySnapshot.forEach((notificationDoc) => {
            batch.delete(notificationDoc.ref)
          })
          await batch.commit()
        }

        // 5. Display a success message
        alert('Task deleted successfully')

        // 6. Redirect to '/' after deleting the task
        router.push('/')
      } else {
        // Handle unauthorized access (e.g., show an error message)
        console.error('Unauthorized access to task:', taskId)
        alert('You are not authorized to delete this task.')
      }
    } catch (error) {
      // Display an error message
      console.error('Error deleting task:', error)
      alert('Error deleting task: ' + error + 'Please try again!')
    }
  }

  const deleteAllTasks = async () => {
    try {
      // Check if a user is logged in
      if (!userStore.isLoggedIn) {
        console.error('User must be logged in to delete tasks.')
        alert('Please log in to delete tasks.')
        return
      }

      const currentUserId = userStore.userId

      // Start transaction
      await runTransaction(db, async (transaction) => {
        // 1. Get all tasks created by the user
        const tasksRef = collection(db, 'tasks')
        const tasksQuery = query(tasksRef, where('createdBy', '==', currentUserId))
        const tasksSnapshot = await getDocs(tasksQuery)

        // 2. Delete all tasks
        tasksSnapshot.docs.forEach((doc) => transaction.delete(doc.ref))

        // 3. Get all notifications
        const notificationsRef = collection(db, 'users', currentUserId, 'notifications')
        const notificationsQuery = query(notificationsRef)
        const notificationsSnapshot = await getDocs(notificationsQuery)

        // 4. Delete all notifications
        notificationsSnapshot.docs.forEach((doc) => transaction.delete(doc.ref))

        // 5. Clear createdTasks array
        const userRef = doc(db, 'users', currentUserId)
        transaction.update(userRef, {
          createdTasks: [],
          notificationSettings: {
            // Reset settings opcional
            enabled: false,
            time: []
          }
        })
      })

      // 6. Feedback y limpieza adicional
      alert('All tasks and related notifications deleted successfully')

      // 7. Resetear store de notificaciones si es necesario
      const notificationsStore = useNotificationsStore()
      notificationsStore.clearTimeouts()
      notificationsStore.clearNotifications()
    } catch (error) {
      console.error('Error deleting tasks:', error)
      alert(`Error deleting tasks: ${error.message}. Please try again!`)
    }
  }

  const deleteAllTasksInProject = async () => {
    try {
      // Verificar autenticación
      if (!userStore.isLoggedIn) {
        alert('Please log in to delete tasks.')
        return
      }

      const currentUserId = userStore.userId
      const projectId = selectedProjectId.value

      // Obtener referencia del proyecto
      const projectRef = doc(db, 'projects', projectId)
      const projectDoc = await getDoc(projectRef)

      if (!projectDoc.exists() || projectDoc.data().userId !== currentUserId) {
        alert('Project not found or unauthorized')
        return
      }

      // Crear batch para operaciones atómicas
      const batch = writeBatch(db)

      // 1. Obtener todas las tareas del proyecto
      const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId))
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
        batch.delete(taskDoc.ref)
        batch.update(doc(db, 'users', currentUserId), {
          createdTasks: arrayRemove(taskId)
        })
      }

      // 5. Eliminar todas las notificaciones encontradas
      notificationsToDelete.forEach((ref) => batch.delete(ref))

      // Ejecutar batch atómico
      await batch.commit()

      // 6. Limpiar estado y notificar
      alert('All tasks and related notifications deleted successfully')
      router.push('/')
    } catch (error) {
      console.error('Error deleting project tasks:', error)
      alert(`Error: ${error.message}`)
    }
  }

  // Add a new project to Firestore
  const createProject = async (newProject) => {
    // Check if a user is logged in
    if (!userStore.isLoggedIn) {
      console.error('User must be logged in to create a project.')
      alert('Please log in to create a project.')
      return // Stop execution if not logged in
    }

    // Check if the project is being created
    if (isSaving.value) return
    isSaving.value = true
    try {
      // Check if all fields are filled
      if (validProjectForm(newProject)) {
        // Add the project to Firestore
        const docRef = await addDoc(collection(db, 'projects'), {
          ...newProject,
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId: newProject.title.toLowerCase().replace(/\s/g, '-'),
          userId: userStore.userId,
          createdBy: userStore.userId // Add the user ID to the project data
        })
        // Display a success message
        alert('Project with ID: ' + docRef.id + ' created successfully!')
      } else {
        // Display an error message
        throw new Error('All fields are required.')
      }
    } catch (error) {
      // Display an error message
      console.error('Error creating project:', error, error.message, 'Please try again!')
      alert('Error creating project: ' + error.message + ' Please try again!')
    } finally {
      // Reset isSaving flag
      isSaving.value = false
    }
  }

  // Edit an existing project in Firestore
  const saveEditedProject = async (projectId, editedProject) => {
    // Check if a user is logged in
    if (!userStore.isLoggedIn) {
      console.error('User must be logged in to edit a project.')
      alert('Please log in to edit a project.')
      return // Stop execution if not logged in
    }

    // Check if the project is being edited
    if (isSaving.value) return
    isSaving.value = true
    try {
      // Check if all fields are filled
      if (validProjectForm(editedProject)) {
        // Fetch the project from Firestore to check ownership
        const projectRef = doc(db, 'projects', projectId)
        const projectDoc = await getDoc(projectRef)
        const projectData = projectDoc.data()

        // Check if the user owns the project
        if (projectData.createdBy === userStore.userId) {
          // Update the project in Firestore
          await updateDoc(projectRef, {
            ...editedProject,
            projectId: editedProject.title.toLowerCase().replace(/\s/g, '-')
          })
          // Display a success message
          alert('Project with ID: ' + projectId + ' edited successfully')
        } else {
          // Handle unauthorized access (e.g., show an error message)
          console.error('Unauthorized access to project:', projectId)
          alert('You are not authorized to edit this project.')
        }
      } else {
        // Display an error message
        throw new Error('All fields are required. Please try again!')
      }
    } catch (error) {
      // Display an error message
      console.error('Error updating project:', error)
      alert('Error updating project: ' + error.message + ' Please try again!')
    } finally {
      // Reset isSaving flag
      isSaving.value = false
    }
  }

  // Delete a project from Firestore
  const deleteProject = async (projectId) => {
    try {
      // Check if a user is logged in
      if (!userStore.isLoggedIn) {
        console.error('User must be logged in to delete a project.')
        alert('Please log in to delete a project.')
        return // Stop execution if not logged in
      }

      // Fetch the project from Firestore to check ownership
      const projectRef = doc(db, 'projects', projectId)
      const projectDoc = await getDoc(projectRef)
      const projectData = projectDoc.data()

      // Check if the user owns the project
      if (projectData.userId === userStore.userId) {
        // Delete all tasks in the project
        await deleteAllTasksInProject(projectId)

        // Delete the project from Firestore
        await deleteDoc(projectRef)

        // Display a success message
        alert('Project deleted successfully')

        // Update taskStore.selectedProject if it matches the deleted project
        if (selectedProject.value === projectId) {
          selectedProject.value = null
        }

        // Redirect to '/' after deleting the project
        router.push('/')
      } else {
        // Handle unauthorized access (e.g., show an error message)
        console.error('Unauthorized access to project:', projectId)
        alert('You are not authorized to delete this project.')
      }
    } catch (error) {
      // Display an error message
      console.error('Error deleting project:', error)
      alert('Error deleting project: ' + error.message + ' Please try again!')
    }
  }

  const clearUserData = () => {
    tasksData.value = []
    projectsData.value = []
    projectTemplatesData.value = []
    labelsData.value = []
    prioritiesData.value = []
    statusesData.value = []
    colorsData.value = []
    iconsData.value = []
    newTask.value = {
      title: '',
      description: '',
      project: '',
      label: '',
      priority: '',
      status: '',
      startDate: null,
      endDate: null,
      completed: false,
      createdAt: null,
      createdBy: '',
      projectId: ''
    }
    editedTask.title = ''
    editedTask.description = ''
    editedTask.project = ''
    editedTask.label = ''
    editedTask.priority = ''
    editedTask.status = ''
    editedTask.startDate = null
    editedTask.endDate = null
    newProject.color = ''
    newProject.createdAt = ''
    newProject.icon = ''
    newProject.projectId = ''
    newProject.title = ''
    newProject.userId = ''
    editedProject.title = ''
    editedProject.icon = ''
    editedProject.color = ''
  }

  watch(
    () => userStore.user,
    (newUserValue) => {
      if (newUserValue === null) {
        clearUserData()
      }
    }
  )

  // Helper function to unsubscribe from a specific collection
  const unsubscribeFromCollection = (collectionName) => {
    if (listeners.value[collectionName]) {
      try {
        listeners.value[collectionName]()
        delete listeners.value[collectionName]
      } catch (error) {
        console.error('Error unsubscribing from listener:', error)
      }
    }
  }

  // Helper function to unsubscribe from all listeners
  const unsubscribeAll = () => {
    for (const collectionName in listeners.value) {
      unsubscribeFromCollection(collectionName)
    }
    listeners.value = {} // Reset listeners object
  }

  // Lifecycle hooks
  onMounted(() => {
    subscribeToCollection('users', userData)
    subscribeToCollection('tasks', tasksData)
    subscribeToCollection('projects', projectsData)
    subscribeToCollection('projectTemplates', projectTemplatesData)
    subscribeToCollection('labels', labelsData)
    subscribeToCollection('priorities', prioritiesData)
    subscribeToCollection('statuses', statusesData)
    subscribeToCollection('colors', colorsData)
    subscribeToCollection('icons', iconsData)
  })

  onUnmounted(unsubscribeAll)

  return {
    // State
    db,
    listeners,
    newTask,
    editedTask,
    newProject,
    editedProject,
    isSaving,

    // Getters
    tasks,
    projects,
    projectTemplates,
    labels,
    priorities,
    statuses,
    colors,
    icons,
    tasksData,
    projectsData,
    projectTemplatesData,
    labelsData,
    prioritiesData,
    statusesData,
    colorsData,
    iconsData,
    projectItems,
    projectTemplateItems,
    labelItems,
    priorityItems,
    statusItems,
    colorItems,
    iconItems,
    newTaskData,
    editedTaskData,
    newProjectData,
    editedProjectData,
    selectedProject,
    selectedProjectId,
    newTaskProjectId,
    // userId,

    // Actions
    fetchCollection,
    subscribeToCollection,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    deleteAllTasks,
    deleteAllTasksInProject,
    createProject,
    saveEditedProject,
    deleteProject,
    clearUserData,
    // Helper functions
    unsubscribeFromCollection,
    unsubscribeAll
  }
})
