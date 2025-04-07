// taskStore.js

import { defineStore } from 'pinia'
import { useDataStore } from './dataStore.js'
import { useProjectStore } from './projectStore.js'
import { useUserStore } from './userStore.js'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from './notificationsStore.js'
import { validTaskForm } from '@/composables/validationFormRules.js'
import { db } from '../firebase.js'
import { ref, computed, watch, reactive, onMounted } from 'vue'
import {
  doc,
  updateDoc,
  getDoc,
  addDoc,
  deleteDoc,
  getDocs,
  arrayUnion,
  arrayRemove,
  runTransaction,
  writeBatch,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  onSnapshot,
  endBefore,
  limitToLast
} from 'firebase/firestore'

export const useTaskStore = defineStore('tasks', () => {
  const dataStore = useDataStore()
  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()
  const router = useRouter()

  // State

  const tasksData = ref([])
  const selectedProject = ref(null)
  const pageSize = 6
  const firstVisibleTask = ref(null)
  const lastVisibleTaskDoc = ref(null)
  /* ===> Recommendation:
  For pagination, it's better to use lastVisibleTaskDoc,
  because it allows you to interact directly with the Firestore document
  and efficiently fetch the subsequent documents.

  Explanation:
  * lastVisibleTaskDoc is a reference to the actual Firestore document that represents
  the last visible task on the current page.
  * Using lastVisibleTaskDoc with the startAfter method in Firestore allows you to fetch
  the next page of documents efficiently, starting from the last visible document.
  * This approach is more efficient than using lastVisibleTask because it avoids
  fetching the entire dataset every time you want to navigate to a different page. */
  const hasNextPage = ref(true)
  const hasPrevPage = ref(false)
  const currentPage = ref(1)
  const allTasksProject = ref([])
  const searchTaskTitle = ref(null)
  const selectedProjects = ref([])
  const selectedPriorities = ref([])
  const selectedStatuses = ref([])
  const selectedLabels = ref([])
  const selectedEndDate = ref(null)
  const filteredTasks = ref([])
  const error = ref(null) // Store error messages
  const dialogEditTask = ref(false)
  const noResultsMessage = ref(false)
  const newTask = reactive({
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

  const listeners = ref({
    tasks: null
  })

  // Getters
  const tasks = computed(() => {
    return tasksData.value
  })

  const newTaskData = computed(() => {
    return newTask
  })

  const editedTaskData = computed(() => {
    return editedTask
  })

  const newTaskProjectId = computed(() => {
    const project = projectStore.projects.find((project) => project.title === newTask.project)
    return project?.id || null // Optional chaining + nullish coalescing
  })

  const projects = computed(() => {
    return projectStore.projects
  })

  const labels = computed(() => {
    return dataStore.labels
  })

  const priorities = computed(() => {
    return dataStore.priorities
  })

  const statuses = computed(() => {
    return dataStore.statuses
  })

  const colors = computed(() => {
    return dataStore.colors
  })

  const isSelectedProject = computed(() => {
    return projects.value.find((project) => project.title === selectedProject.value)
  })

  const tasksInSelectedProject = computed(() => {
    if (selectedProject.value) {
      return tasks.value.filter((task) => task.project === selectedProject.value)
    } else {
      return []
    }
  })

  const totalPagesInSelectedProject = computed(() => {
    return Math.ceil(tasksInSelectedProject.value.length / pageSize)
  })

  const tasksInFilteredTasks = computed(() => {
    // Start with all tasks
    let filteredTasks = tasks.value

    // Apply filters one by one
    if (searchTaskTitle.value) {
      filteredTasks = filteredTasks.filter((task) =>
        task.title.toLowerCase().includes(searchTaskTitle.value.toLowerCase())
      )
    }
    if (selectedProjects.value.length > 0) {
      filteredTasks = filteredTasks.filter((task) => selectedProjects.value.includes(task.project))
    }
    if (selectedPriorities.value.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedPriorities.value.includes(task.priority)
      )
    }
    if (selectedStatuses.value.length > 0) {
      filteredTasks = filteredTasks.filter((task) => selectedStatuses.value.includes(task.status))
    }
    if (selectedLabels.value.length > 0) {
      filteredTasks = filteredTasks.filter((task) => selectedLabels.value.includes(task.label))
    }
    if (selectedEndDate.value) {
      filteredTasks = filteredTasks.filter((task) => {
        // const taskEndDate = new Date(task.endDate.toDate()) // Convert Firestore Timestamp to Date
        // const selectedEndDateObj = new Date(selectedEndDate.value) // Convert selectedEndDate to Date
        // return taskEndDate.toDateString() === selectedEndDateObj.toDateString() // Compare dates
        return task.endDate === selectedEndDate.value
      })
    }
    return filteredTasks
  })

  const totalPagesInFilteredTasks = computed(() => {
    return Math.ceil(tasksInFilteredTasks.value.length / pageSize)
  })

  const completedTasks = computed(() => {
    return tasks.value.filter((task) => task.completed)
  })

  const pendingTasks = computed(() => {
    return tasks.value.filter((task) => !task.completed)
  })

  const completedTasksInSelectedProject = computed(() => {
    return tasksInSelectedProject.value.filter((task) => task.completed)
  })

  const pendingTasksInSelectedProject = computed(() => {
    return tasksInSelectedProject.value.filter((task) => !task.completed)
  })

  const projectColor = computed(() => {
    const project = projects.value.find((project) => project.title === selectedProject.value)
    return project?.color || 'default'
  })
  // Actions
  // const showSnackbar = (message, color = 'success', prependIcon = '', appendIcon = '') => {
  //   notificationsStore.updateSnackbar(message, true, prependIcon, appendIcon, color)
  // }
  const subscribeToTasks = () => {
    const q = query(collection(db, 'tasks'), orderBy('title', 'asc'))
    listeners.value.tasks = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const index = tasksData.value.findIndex((t) => t.id === change.doc.id)
        switch (change.type) {
          case 'added':
            if (index === -1) tasksData.value.push({ id: change.doc.id, ...change.doc.data() })
            break
          case 'modified':
            if (index !== -1)
              tasksData.value.splice(index, 1, { id: change.doc.id, ...change.doc.data() })
            break
          case 'removed':
            if (index !== -1) tasksData.value.splice(index, 1)
            break
        }
      })
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
        const projectColor = await getProjectColor(newTask.project)
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
        const projectColor = await getProjectColor(editedTask.project)
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

  // Get tasks by project paginated
  const getTasksByProjectPaginated = async ({
    next = false,
    prev = false,
    last = false,
    first = false
  } = {}) => {
    try {
      // Define the base query for tasks in the selected project
      let tasksRef = query(
        collection(db, 'tasks'),
        where('createdBy', '==', userStore.userId), // Filter by user ID
        where('project', '==', selectedProject.value), // Filter by selected project
        orderBy('endDate', 'asc'), // Order by endDate first
        orderBy('title', 'desc'), // Then by title in descending order
        limit(pageSize) // Limit to pageSize
      )

      // Apply pagination logic based on options
      tasksRef = applyPagination(tasksRef, next, prev, last, first)

      // Update pagination state based on the fetched data
      if (tasksRef) {
        // Clear the allTasksProject array before fetching new data
        allTasksProject.value = []
        // Subscribe to the new listener
        onSnapshot(tasksRef, (snapshot) => {
          // Use docChanges() to efficiently handle changes
          snapshot.docChanges().forEach((change) => {
            updateTaskArray(allTasksProject, change)
          })

          // Update pagination state
          lastVisibleTaskDoc.value = snapshot.docs[snapshot.docs.length - 1]
          firstVisibleTask.value = snapshot.docs[0]
          // Update pagination state based on the fetched data
          hasNextPage.value =
            snapshot.docs.length === pageSize &&
            currentPage.value < totalPagesInSelectedProject.value

          hasPrevPage.value = currentPage.value > 1
        })
      }
    } catch (error) {
      console.error('Error getting tasks:', error)
    }
  }

  // Mark a task as completed/uncompleted in Firestore
  const completeTask = async (taskId) => {
    let statusChange // Tracks the new status for error handling context
    try {
      // 1. Find the task in the local state using the task ID
      const task = tasks.value.find((t) => t.id === taskId)

      // 2. Validate task existence
      if (!task) {
        throw new Error('Task not found.')
      } else {
        // 3. Determine current completion state
        const wasCompleted = task.completed

        // 4. Set human-readable status change message
        statusChange = wasCompleted ? 'In Progress' : 'Done'

        // 5. Firebase document reference and update operation
        const taskRef = doc(db, 'tasks', taskId)
        await updateDoc(taskRef, {
          completed: !wasCompleted, // Toggle boolean value
          status: statusChange // Apply new status
        })

        // 6. Show success notification with contextual details
        notificationsStore.displaySnackbar(
          `Task "${task.title}" set to ${statusChange}!`, // Dynamic title inclusion
          'success',
          wasCompleted ? 'mdi-progress-check' : 'mdi-check-circle' // Status-based icon
        )
      }
    } catch (error) {
      // 7. Error handling: construct contextual error message
      const errorAction = statusChange
        ? `change to ${statusChange}` // Use known status if available
        : 'update' // Fallback for unexpected errors

      // 8. Show error notification with operational context
      notificationsStore.displaySnackbar(
        `Failed to ${errorAction}: ${error.message}`, // Dynamic error context
        'error',
        'mdi-alert-circle' // Universal error icon
      )

      // 9. Log full error details for debugging
      console.error('Task update error:', error)
    }
  }

  // Set the selected project title
  const setSelectedProject = (projectName) => {
    selectedProject.value = projectName // Store the project title
  }

  // Get filtered tasks paginated
  // En taskStore.js
  const getFilteredTasksPaginated = async ({
    next = false,
    prev = false,
    last = false,
    first = false
  } = {}) => {
    try {
      // Verify if filters
      const hasFilters =
        searchTaskTitle.value ||
        selectedProjects.value.length > 0 ||
        selectedPriorities.value.length > 0 ||
        selectedStatuses.value.length > 0 ||
        selectedLabels.value.length > 0 ||
        selectedEndDate.value

      if (!hasFilters) {
        filteredTasks.value = []
        noResultsMessage.value = false
        return
      }

      // Define the base query for filtered tasks
      let tasksRef = query(
        collection(db, 'tasks'),
        orderBy('endDate', 'asc'),
        orderBy('title', 'desc'),
        limit(pageSize)
      )

      let q = query(tasksRef)

      // Aplicar filtros solo si existen
      const filters = {
        searchTaskTitle: searchTaskTitle.value,
        selectedProjects: selectedProjects.value,
        selectedPriorities: selectedPriorities.value,
        selectedStatuses: selectedStatuses.value,
        selectedLabels: selectedLabels.value,
        selectedEndDate: selectedEndDate.value
      }

      q = applyFilters(q, filters)

      // Aplicar paginación
      q = applyPagination(q, next, prev, last, first)

      if (q) {
        filteredTasks.value = []
        onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            updateTaskArray(filteredTasks, change)
          })

          lastVisibleTaskDoc.value = snapshot.docs[snapshot.docs.length - 1]
          firstVisibleTask.value = snapshot.docs[0]
          hasNextPage.value =
            snapshot.docs.length === pageSize && currentPage.value < totalPagesInFilteredTasks.value

          hasPrevPage.value = currentPage.value > 1
          noResultsMessage.value = snapshot.empty
        })
      }
    } catch (error) {
      console.error('Error getting filtered tasks:', error)
      error.value = 'Error loading tasks'
    }
  }

  // Helper function to apply pagination logic
  const applyPagination = (tasksRef, next, prev, last, first) => {
    let lastPageElements // Declare the variable outside the switch

    // Determine which function is calling applyPagination
    const isFilteredTasks =
      searchTaskTitle.value ||
      selectedProjects.value.length > 0 ||
      selectedPriorities.value.length > 0 ||
      selectedStatuses.value.length > 0 ||
      selectedLabels.value.length > 0 ||
      selectedEndDate.value

    // Use the appropriate variables based on the function calling applyPagination
    const totalPages = isFilteredTasks
      ? totalPagesInFilteredTasks.value
      : totalPagesInSelectedProject.value
    const tasksArray = isFilteredTasks ? tasksInFilteredTasks.value : tasksInSelectedProject.value

    switch (true) {
      case next:
        // Get the next page using startAfter and limit
        tasksRef = query(tasksRef, startAfter(lastVisibleTaskDoc.value), limit(pageSize))
        currentPage.value++
        break
      case prev:
        // Get the previous page using endBefore and limitToLast
        tasksRef = query(tasksRef, endBefore(firstVisibleTask.value), limitToLast(pageSize))
        currentPage.value--
        break
      case last:
        // Get the last page
        // Calculate the number of elements to fetch for the last page
        lastPageElements = tasksArray.length % pageSize // Now it's declared outside
        // If the last page has less elements than pageSize, use limitToLast
        if (lastPageElements > 0) {
          tasksRef = query(
            tasksRef,
            startAfter(lastVisibleTaskDoc.value),
            limitToLast(lastPageElements)
          )
        } else {
          // If the last page has pageSize elements, use limit
          tasksRef = query(tasksRef, startAfter(lastVisibleTaskDoc.value), limitToLast(pageSize))
        }
        currentPage.value = totalPages
        break
      case first:
        // Get the first page
        tasksRef = query(tasksRef, limit(pageSize))
        currentPage.value = 1
        break
      default:
        // Handle initial page (no pagination action)
        tasksRef = query(tasksRef, limit(pageSize))
        currentPage.value = 1
        break
    }

    return tasksRef
  }

  // Helper function to update task array based on changes
  const updateTaskArray = (taskArray, change) => {
    const index = taskArray.value.findIndex((task) => task.id === change.doc.id)
    switch (change.type) {
      case 'added':
        // Check for duplicates before adding
        if (index === -1) {
          // Add the new document to the array
          taskArray.value.push({
            id: change.doc.id,
            ...change.doc.data(),
            projectColor:
              colors.value.find((color) => color.title === change.doc.data().project)?.title ||
              'default'
          })
        }
        break
      case 'modified':
        if (index !== -1) {
          // Update the existing document in the array
          taskArray.value.splice(index, 1, {
            id: change.doc.id,
            ...change.doc.data(),
            projectColor:
              colors.value.find((color) => color.title === change.doc.data().project)?.title ||
              'default'
          })
        }
        break
      case 'removed':
        if (index !== -1) {
          // Remove the document from the array
          taskArray.value.splice(index, 1)
        }
        break
    }
  }

  // Helper function to apply filters to a Firestore query
  const applyFilters = (q, filters) => {
    if (filters.searchTaskTitle && filters.searchTaskTitle.trim() !== '') {
      q = query(q, where('title', '==', filters.searchTaskTitle))
    }
    if (filters.selectedProjects && filters.selectedProjects.length > 0) {
      q = query(q, where('project', 'in', filters.selectedProjects))
    }
    if (filters.selectedPriorities && filters.selectedPriorities.length > 0) {
      q = query(q, where('priority', 'in', filters.selectedPriorities))
    }
    if (filters.selectedStatuses && filters.selectedStatuses.length > 0) {
      q = query(q, where('status', 'in', filters.selectedStatuses))
    }
    if (filters.selectedLabels && filters.selectedLabels.length > 0) {
      q = query(q, where('label', 'in', filters.selectedLabels))
    }
    if (filters.selectedEndDate) {
      const selectedEndDateObj = new Date(filters.selectedEndDate)
      // Get the year, month, and day components
      const year = selectedEndDateObj.getFullYear()
      const month = selectedEndDateObj.getMonth()
      const day = selectedEndDateObj.getDate()

      // Create a Date object for the beginning of the selected date
      const startOfDay = new Date(year, month, day, 0, 0, 0)

      // Create a Date object for the end of the selected date
      const endOfDay = new Date(year, month, day, 23, 59, 59)

      q = query(q, where('endDate', '>=', startOfDay), where('endDate', '<=', endOfDay))
    }
    return q
  }

  watch(
    () => [
      selectedProject.value,
      searchTaskTitle.value,
      selectedProjects.value,
      selectedPriorities.value,
      selectedStatuses.value,
      selectedLabels.value,
      selectedEndDate.value
    ],
    async () => {
      // Fetch the filtered tasks
      await getFilteredTasksPaginated()
    },
    { immediate: true } // Fetch filtered tasks initially
  )

  watch(
    () => selectedProject.value,
    async () => {
      // If a project is selected, fetch paginated tasks for that project
      if (selectedProject.value) {
        await getTasksByProjectPaginated()
      }
    },
    { immediate: true } // Fetch filtered tasks initially
  )

  const editTask = async (taskId) => {
    try {
      dialogEditTask.value = true
      // Get the task data from Firestore
      const task = await dataStore.getTask(taskId)

      if (task) {
        // Assign the task data to dataStore.editedTask
        Object.assign(dataStore.editedTask, task)
      } else {
        console.error('Task not found')
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Helper function to fetch project data and get color
  const getProjectColor = async (projectName) => {
    // Fetch projects data only if it's not already loaded
    if (!projectStore.projectsData.value) {
      await dataStore.fetchCollection('projects', projectStore.projectsData)
    }

    // Find the project with the matching title
    const project = projectStore.projects.find((project) => project.title === projectName)

    // Get the project color
    return project ? project.color : 'default'
  }

  // Helper function to clean filters
  const resetFilters = () => {
    // Clear filters in the taskStore state (reactive variables) to reset the UI
    searchTaskTitle.value = null
    selectedProjects.value = []
    selectedPriorities.value = []
    selectedStatuses.value = []
    selectedLabels.value = []
    selectedEndDate.value = null

    // Clear pagination state to reset the UI
    firstVisibleTask.value = null
    lastVisibleTaskDoc.value = null
    hasNextPage.value = true
    hasPrevPage.value = false
    currentPage.value = 1
  }

  onMounted(() => {
    subscribeToTasks() // Escucha los cambios en la colección 'tasks'
  })

  return {
    // State
    selectedProject,
    pageSize,
    firstVisibleTask,
    lastVisibleTaskDoc,
    hasNextPage,
    hasPrevPage,
    currentPage,
    allTasksProject,
    searchTaskTitle,
    selectedProjects,
    selectedPriorities,
    selectedStatuses,
    selectedLabels,
    selectedEndDate,
    filteredTasks,
    error,
    dialogEditTask,
    noResultsMessage,
    newTask,
    editedTask,
    isSaving,
    listeners,
    newTaskData,
    editedTaskData,
    newTaskProjectId,
    // State for pagination
    tasksData,
    // Getters (computed properties)
    projects,
    tasks,
    labels,
    priorities,
    statuses,
    colors,
    isSelectedProject,
    tasksInSelectedProject,
    tasksInFilteredTasks,
    totalPagesInSelectedProject,
    totalPagesInFilteredTasks,
    completedTasks,
    pendingTasks,
    completedTasksInSelectedProject,
    pendingTasksInSelectedProject,
    projectColor,
    // Actions (methods)
    getTasksByProjectPaginated,
    setSelectedProject,
    getFilteredTasksPaginated,
    // Actions for pagination
    applyPagination,
    applyFilters,
    // Actions for task management
    deleteAllTasks,
    deleteTask,
    getTask,
    createTask,
    updateTask,
    completeTask,
    subscribeToTasks,
    resetFilters,
    // Helper functions
    editTask,
    getProjectColor,
    updateTaskArray
  }
})
