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
import { useProjectStore } from './projectStore.js'
import { useUserStore } from './userStore.js'
import { useNotificationsStore } from './notificationsStore.js'
import { useRouter } from 'vue-router'
import { validTaskForm } from '@/composables/validationFormRules.js'

export const useDataStore = defineStore('data', () => {
  const taskStore = useTaskStore()
  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()
  const router = useRouter()

  // State
  const userData = ref([])
  const tasksData = ref([])
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
  const isSaving = ref(false)
  // Listeners (store unsubscribe functions for each collection)
  const listeners = ref({
    tasks: null,
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
  const newTaskProjectId = computed(() => {
    const project = projectStore.projects.find((project) => project.title === newTask.value.project)
    return project?.id || null // Optional chaining + nullish coalescing
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
        notificationsStore.displaySnackbar('Error fetching data', 'error', 'mdi-close-circle')
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
      notificationsStore.displaySnackbar(
        'Please log in to edit a task.',
        'error',
        'mdi-account-off'
      )
      return // Stop execution if not logged in
    }
    // Check if the user ID is defined
    if (!userStore.userId) {
      console.error('User ID is undefined. Please log in.')
      notificationsStore.displaySnackbar(
        'User ID is undefined. Please log in.',
        'error',
        'mdi-account-off'
      )
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
        notificationsStore.displaySnackbar(
          'Task created successfully',
          'success',
          'mdi-check-circle'
        )
        // Display a success message
      } else {
        // Display an error message
        notificationsStore.displaySnackbar(
          'All fields are required. Please try again.',
          'error',
          'mdi-alert-circle'
        )
        throw new Error('All fields are required.')
      }
    } catch (error) {
      console.error('createTask: Error creating task:', error) // Imprime el error en la consola
      notificationsStore.displaySnackbar(
        'An error occurred while creating the task. Please try again.',
        'error',
        'mdi-close-circle'
      ) // Muestra un mensaje de error
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
      notificationsStore.displaySnackbar(
        'Please log in to edit a task.',
        'error',
        'mdi-account-off'
      )
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

        // Check if the user owns the task
        if (taskData.createdBy === userStore.userId) {
          const isCompleted = editedTask.status === 'Done'

          // Combine the date and time for the start date
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
          notificationsStore.displaySnackbar(
            'Task updated successfully',
            'success',
            'mdi-check-circle'
          )
        } else {
          // Handle unauthorized access (e.g., show an error message)
          console.error('Unauthorized access to task:', taskId)
          notificationsStore.displaySnackbar(
            'You are not authorized to edit this task.',
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
      console.error('Error updating task:', error)
      notificationsStore.displaySnackbar(
        error.message || 'An error occurred while updating the task. Please try again.',
        'error',
        'mdi-close-circle'
      )
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
        notificationsStore.displaySnackbar(
          'Please log in to delete a task.',
          'error',
          'mdi-account-off'
        )
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
        notificationsStore.displaySnackbar(
          'Task deleted successfully',
          'success',
          'mdi-check-circle'
        )

        // 6. Redirect to '/' after deleting the task
        router.push('/')
      } else {
        // Handle unauthorized access (e.g., show an error message)
        console.error('Unauthorized access to task:', taskId)
        notificationsStore.displaySnackbar(
          'You are not authorized to delete this task.',
          'warning',
          'mdi-alert-circle'
        )
      }
    } catch (error) {
      // Display an error message
      console.error('Error deleting task:', error)
      notificationsStore.displaySnackbar(
        'Error deleting task: ' + error + 'Please try again!',
        'error',
        'mdi-close-circle'
      )
    }
  }

  const deleteAllTasks = async () => {
    try {
      // Check if a user is logged in
      if (!userStore.isLoggedIn) {
        console.error('User must be logged in to delete tasks.')
        notificationsStore.displaySnackbar(
          'Please log in to delete tasks.',
          'error',
          'mdi-account-off'
        )
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
      notificationsStore.displaySnackbar(
        'All tasks and related notifications deleted successfully',
        'success',
        'mdi-check-circle'
      )

      // 7. Resetear store de notificaciones si es necesario
      const notificationsStore = useNotificationsStore()
      notificationsStore.clearTimeouts()
      notificationsStore.clearNotifications()
    } catch (error) {
      console.error('Error deleting tasks:', error)
      notificationsStore.displaySnackbar(
        `Error deleting tasks: ${error.message}. Please try again!`,
        'error',
        'mdi-close-circle'
      )
    }
  }

  const clearUserData = () => {
    tasksData.value = []
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
  }

  watch(
    () => userStore.user,
    (newUserValue) => {
      if (newUserValue === null) {
        clearUserData()
        projectStore.clearProjectsData()
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
    isSaving,

    // Getters
    tasks,
    projectTemplates,
    labels,
    priorities,
    statuses,
    colors,
    icons,
    tasksData,
    projectTemplatesData,
    labelsData,
    prioritiesData,
    statusesData,
    colorsData,
    iconsData,
    projectTemplateItems,
    labelItems,
    priorityItems,
    statusItems,
    colorItems,
    iconItems,
    newTaskData,
    editedTaskData,
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
    clearUserData,
    // Helper functions
    unsubscribeFromCollection,
    unsubscribeAll
  }
})
