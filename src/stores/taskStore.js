// taskStore.js
import { defineStore } from 'pinia'

// Import local store modules
import { useDataStore } from './dataStore.js'
import { useNotificationsStore } from './notificationsStore.js'
import { useProjectStore } from './projectStore.js'
import { useUserStore } from './userStore.js'

// Import composables
import { validTaskForm } from '@/composables/validationFormRules.js'

// Import Firebase modules
import { db } from '../firebase.js'
import {
  doc,
  updateDoc,
  getDoc,
  addDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  onSnapshot,
  endBefore,
  limitToLast,
  collectionGroup
} from 'firebase/firestore'

// Import Vue core utilities
import { ref, computed, watch, reactive, onMounted } from 'vue'

// Import local utility functions
import {
  convertTimestamp,
  combineDateTime,
  getStartAndEndOfDay,
  createTaskData
} from './taskUtils.js'

export const useTaskStore = defineStore('tasks', () => {
  const dataStore = useDataStore()
  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()

  // State
  // --- Task Data ---
  const tasksData = ref([]) // Array to store the main list of tasks
  const allTasksProject = ref([]) // Array to store all tasks for the currently selected project (potentially for calculations)
  const filteredTasks = ref([]) // Array to store tasks after applying filters
  const isLoading = ref(false) // Flag to indicate if tasks are being loaded

  // --- Current/Editing Task State ---
  const newTask = reactive({
    // Reactive object for creating new tasks
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
    // Reactive object for editing existing tasks
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
  const isSaving = ref(false) // Flag to indicate if a task creation/update operation is in progress

  // --- Selection & Filters ---
  const selectedProject = ref(null) // Ref to store the title of the currently selected project
  const searchTaskTitle = ref(null) // Ref to store the search term for filtering tasks by title
  const selectedProjects = ref([]) // Ref to store an array of selected project titles for filtering
  const selectedPriorities = ref([]) // Ref to store an array of selected priorities for filtering
  const selectedStatuses = ref([]) // Ref to store an array of selected statuses for filtering
  const selectedLabels = ref([]) // Ref to store an array of selected labels for filtering
  const selectedEndDate = ref(null) // Ref to store the selected end date for filtering

  // --- Pagination ---
  const pageSize = 6 // Number of tasks to display per page
  const firstVisibleTask = ref(null) // Ref to store the first visible task document on the current page (for pagination)
  const lastVisibleTaskDoc = ref(null) // Ref to store the last visible task document on the current page (for pagination)
  const hasNextPage = ref(true) // Flag to indicate if there is a next page of tasks
  const hasPrevPage = ref(false) // Flag to indicate if there is a previous page of tasks
  const currentPage = ref(1) // Ref to store the current page number
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

  // --- UI State & Errors ---
  const error = ref(null) // Ref to store error messages
  const dialogEditTask = ref(false) // Ref to control the visibility of the edit task dialog
  const noResultsMessage = ref(false) // Flag to indicate if there are no tasks matching the current filters
  // const listeners = ref({ tasks: null }) // Ref to store Firestore listener unsubscribe functions

  // --- Listeners Management ---
  const listeners = reactive({
    tasks: null, // Listener principal de tareas
    projectTasks: null, // Listener de tareas por proyecto
    filteredTasks: null // Listener de tareas filtradas
  })
  // Getters (computed properties)

  // --- Core Data Accessors ---
  const tasks = computed(() => {
    return tasksData.value.map((task) => ({
      ...task,
      // projectId: task.projectPath,
      project: projectStore.projects.find((p) => p.id === task.projectId) || {
        // Default project if not found
        title: 'No Project',
        color: '#ccc'
      }
    }))
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

  // --- Form Data Accessors ---
  const newTaskData = computed(() => {
    return newTask
  })

  const editedTaskData = computed(() => {
    return editedTask
  })

  // --- Project Specific Getters ---
  const isSelectedProject = computed(() => {
    return projects.value.find((project) => project.title === selectedProject.value)
  })

  const tasksInSelectedProject = computed(() => {
    if (selectedProject.value) {
      const project = projectStore.projects.find((p) => p.title === selectedProject.value)
      if (project) {
        return tasks.value.filter((task) => task.projectId === project.id)
      } else {
        return []
      }
    } else {
      return []
    }
  })

  // --- Filtered Tasks Getters ---
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
        return task.endDate === selectedEndDate.value
      })
    }
    return filteredTasks
  })

  // --- Pagination Getters ---
  const totalPagesInSelectedProject = computed(() => {
    return Math.ceil(tasksInSelectedProject.value.length / pageSize)
  })

  const totalPagesInFilteredTasks = computed(() => {
    return Math.ceil(tasksInFilteredTasks.value.length / pageSize)
  })

  // --- Task Status Getters ---
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

  // --- UI Helper Getters ---
  const projectColor = computed(
    () => projects.value.find((p) => p.title === selectedProject.value)?.color || 'default'
  )

  // --- Query Helper Functions ---
  const getBaseTasksQuery = (userId) => {
    return query(
      collectionGroup(db, 'tasks'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    )
  }

  const getProjectTasksQuery = (userId, projectId) => {
    return query(
      collection(db, 'users', userId, 'projects', projectId, 'tasks'),
      orderBy('endDate', 'asc'),
      orderBy('title', 'desc')
    )
  }

  const getFilteredBaseQuery = (userId) => {
    return query(
      collectionGroup(db, 'tasks'),
      where('createdBy', '==', userId),
      orderBy('endDate', 'asc'),
      orderBy('title', 'desc')
    )
  }

  // Actions

  // --- Task Management (CRUD Operations) ---
  // Get a single task from Firestore
  const getTask = async (projectId, taskId) => {
    try {
      if (!projectId) {
        console.error('Project ID is undefined')
        notificationsStore.displaySnackbar('Project ID is undefined', 'error', 'mdi-alert-circle')
        return null
      }
      const taskRef = doc(db, 'users', userStore.userId, 'projects', projectId, 'tasks', taskId)
      const taskDoc = await getDoc(taskRef)

      return taskDoc.exists()
        ? {
            id: taskDoc.id,
            ...taskDoc.data(),
            startDate: convertTimestamp(taskDoc.data().startDate),
            endDate: convertTimestamp(taskDoc.data().endDate),
            createdAt: convertTimestamp(taskDoc.data().createdAt),
            updatedAt: convertTimestamp(taskDoc.data().updatedAt)
          }
        : null
    } catch (error) {
      console.error('Error getting task:', error)
      notificationsStore.displaySnackbar('Error getting task', 'error', 'mdi-alert-circle')
      return null
    }
  }

  // Create a new task in Firestore
  const createTask = async (newTask) => {
    // Check if a user is logged in
    if (!userStore.isLoggedIn) {
      console.error('User must be logged in to create a task.')
      notificationsStore.displaySnackbar(
        'Please log in to create a task.',
        'error',
        'mdi-account-off'
      )
      return
    }

    // Check if the user ID is defined
    if (!userStore.userId) {
      console.error('User ID is undefined. Please log in.')
      notificationsStore.displaySnackbar(
        'User ID is undefined. Please log in.',
        'error',
        'mdi-account-off'
      )
      return
    }

    if (isSaving.value) return
    isSaving.value = true

    try {
      if (validTaskForm(newTask)) {
        // Find the corresponding project
        const project = projectStore.projects.find((p) => p.title === newTask.project)

        if (!project) {
          notificationsStore.displaySnackbar(
            'Project not found. Please select a valid project.',
            'error',
            'mdi-alert-circle'
          )
          return
        }

        // Combine date and time for endDate
        const endDateFormatted = combineDateTime(newTask.endDate, newTask.endDateHour)

        // Combine date and time for startDate
        const startDateFormatted = combineDateTime(newTask.startDate, newTask.startDateHour)

        // Reference to the tasks subcollection of the project
        const tasksCollectionRef = collection(
          db,
          'users',
          userStore.userId,
          'projects',
          project.id,
          'tasks'
        )

        // Create the new task
        const taskDocRef = await addDoc(tasksCollectionRef, {
          ...newTask,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          completed: false,
          color: project.color,
          taskId: newTask.title.toLowerCase().replace(/ /g, '-'),
          createdBy: userStore.userId,
          projectId: project.id
        })

        notificationsStore.displaySnackbar(
          'Task created successfully',
          'success',
          'mdi-check-circle'
        )

        return taskDocRef.id // Returns the ID of the new task if necessary
      } else {
        notificationsStore.displaySnackbar(
          'All fields are required. Please try again.',
          'error',
          'mdi-alert-circle'
        )
        throw new Error('All fields are required.')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      notificationsStore.displaySnackbar(
        error.message || 'An error occurred while creating the task. Please try again.',
        'error',
        'mdi-close-circle'
      )
      throw error // Throws the error for additional handling if necessary
    } finally {
      isSaving.value = false
    }
  }

  // Edit a task in Firestore
  const editTask = async (projectId, taskId) => {
    try {
      dialogEditTask.value = true
      // Fetch the task data from Firestore
      const task = await getTask(projectId, taskId)

      if (task) {
        Object.assign(editedTask, {
          ...task,
          id: taskId, // Keep the task ID for reference
          projectId: projectId // Keep the project ID for reference
        })
      } else {
        console.error('Task not found')
        notificationsStore.displaySnackbar('Task not found', 'error', 'mdi-alert-circle')
      }
    } catch (error) {
      console.error('Error al cargar la tarea:', error)
      notificationsStore.displaySnackbar('Error al cargar la tarea', 'error', 'mdi-alert-circle')
    }
  }

  // Edit an existing task in Firestore
  const updateTask = async (projectId, taskId, editedTask) => {
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
        const taskRef = doc(db, 'users', userStore.userId, 'projects', projectId, 'tasks', taskId)

        // Fetch the task from Firestore to check ownership
        const taskDoc = await getDoc(taskRef)
        const taskData = taskDoc.data()

        // Check if the user owns the task
        if (taskData.createdBy === userStore.userId) {
          const isCompleted = editedTask.status === 'Done'

          // Combine the date and time for the start date
          const startDateFormatted = combineDateTime(editedTask.startDate, editedTask.startDateHour)
          // Combine the date and time for the end date
          const endDateFormatted = combineDateTime(editedTask.endDate, editedTask.endDateHour)

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

  // Delete a task in Firestore
  const deleteTask = async (projectId, taskId) => {
    try {
      if (!userStore.isLoggedIn) {
        notificationsStore.displaySnackbar('Authentication required.', 'error', 'mdi-account-off')
        return
      }

      const taskRef = doc(db, 'users', userStore.userId, 'projects', projectId, 'tasks', taskId)

      // Check if the task exists
      const taskDoc = await getDoc(taskRef)
      if (!taskDoc.exists()) {
        throw new Error('Task not found')
      }

      // Delete related notifications
      const notificationsRef = collection(db, 'users', userStore.userId, 'notifications')
      const q = query(notificationsRef, where('taskId', '==', taskId))
      const querySnapshot = await getDocs(q)

      const batch = writeBatch(db)
      batch.delete(taskRef)
      querySnapshot.forEach((doc) => batch.delete(doc.ref))

      await batch.commit()

      notificationsStore.displaySnackbar('Task deleted successfully', 'success', 'mdi-check-circle')
    } catch (error) {
      console.error('Error deleting task:', error)
      notificationsStore.displaySnackbar(
        error.message || 'Deletion failed',
        'error',
        'mdi-close-circle'
      )
    }
  }

  // Delete all tasks in Firestore
  const deleteAllTasks = async () => {
    try {
      if (!userStore.userId) {
        notificationsStore.displaySnackbar('Authentication required.', 'error', 'mdi-account-off')
        return
      }

      // Get all user projects
      const projectsQuery = query(collection(db, 'users', userStore.userId, 'projects'))
      const projectsSnapshot = await getDocs(projectsQuery)

      const batch = writeBatch(db)

      // Delete tasks from each project
      for (const projectDoc of projectsSnapshot.docs) {
        const tasksQuery = query(
          collection(db, 'users', userStore.userId, 'projects', projectDoc.id, 'tasks')
        )
        const tasksSnapshot = await getDocs(tasksQuery)
        tasksSnapshot.docs.forEach((taskDoc) => batch.delete(taskDoc.ref))
      }

      await batch.commit()

      notificationsStore.displaySnackbar('All tasks deleted', 'success', 'mdi-check-circle')
    } catch (error) {
      console.error('Error deleting tasks:', error)
      notificationsStore.displaySnackbar(
        error.message || 'Deletion failed',
        'error',
        'mdi-close-circle'
      )
    }
  }

  // --- Task Status Updates ---
  // Set the task as completed or in progress
  const completeTask = async (projectId, taskId) => {
    try {
      if (!projectId || !taskId) {
        console.error('Project ID or Task ID is undefined')
        notificationsStore.displaySnackbar(
          'Project ID or Task ID is undefined',
          'error',
          'mdi-alert-circle'
        )
        return
      }
      const taskRef = doc(db, 'users', userStore.userId, 'projects', projectId, 'tasks', taskId)
      const taskDoc = await getDoc(taskRef)

      if (!taskDoc.exists()) {
        throw new Error('Task not found')
      }

      const currentStatus = taskDoc.data().completed
      const newStatus = !currentStatus

      await updateDoc(taskRef, {
        completed: newStatus,
        status: newStatus ? 'Done' : 'In Progress',
        updatedAt: serverTimestamp()
      })

      notificationsStore.displaySnackbar(
        `Task marked as ${newStatus ? 'completed' : 'in progress'}`,
        'success',
        newStatus ? 'mdi-check-circle' : 'mdi-progress-clock'
      )
    } catch (error) {
      console.error('Error updating task status:', error)
      notificationsStore.displaySnackbar(
        error.message || 'Status update failed',
        'error',
        'mdi-close-circle'
      )
    }
  }

  // --- Data Subscription ---
  const handleProjectTasksSnapshot = (snapshot, allTasksProject) => {
    snapshot.docChanges().forEach((change) => {
      const taskData = createTaskData(change.doc)
      const index = allTasksProject.value.findIndex((t) => t.id === change.doc.id)

      switch (change.type) {
        case 'added':
          if (index === -1) allTasksProject.value.push(taskData)
          break
        case 'modified':
          if (index !== -1) allTasksProject.value.splice(index, 1, taskData)
          break
        case 'removed':
          if (index !== -1) allTasksProject.value.splice(index, 1)
          break
      }
    })
  }

  const handleAllTasksSnapshot = (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const taskData = createTaskData(change.doc)
      const index = tasksData.value.findIndex((t) => t.id === change.doc.id)

      switch (change.type) {
        case 'added':
          if (index === -1) tasksData.value.push(taskData)
          break
        case 'modified':
          if (index !== -1) {
            const projectColor =
              projectStore.projects.find((p) => p.id === taskData.projectId)?.color || 'default'
            taskData.projectColor = projectColor
            tasksData.value.splice(index, 1, taskData)
          }
          break
        case 'removed':
          if (index !== -1) tasksData.value.splice(index, 1)
          break
      }
    })
  }

  // const subscribeToTasks = () => {
  //   if (!userStore.userId) return

  //   const tasksQuery = getBaseTasksQuery(userStore.userId)
  //   listeners.value.tasks = onSnapshot(tasksQuery, handleAllTasksSnapshot) // Usar la nueva función
  // }
  const subscribeToTasks = () => {
    if (!userStore.userId) return
    if (listeners.tasks) listeners.tasks() // Limpiar listener anterior

    const tasksQuery = getBaseTasksQuery(userStore.userId)
    listeners.tasks = onSnapshot(tasksQuery, handleAllTasksSnapshot)
  }

  const subscribeToTaskUpdates = (tasksRef, allTasksProject) => {
    if (listeners.projectTasks) listeners.projectTasks() // Limpiar listener anterior

    listeners.projectTasks = onSnapshot(tasksRef, (snapshot) => {
      handleProjectTasksSnapshot(snapshot, allTasksProject)
      updatePaginationState(snapshot)
    })
  }

  // --- Pagination Control ---
  // Get tasks by project paginated
  const getTasksByProjectPaginated = async ({
    next = false,
    prev = false,
    last = false,
    first = false
  } = {}) => {
    try {
      const project = await validateProjectAndUser()
      if (!project) return

      // Define the base query for tasks in the selected project
      // let tasksRef = defineBaseTaskQuery(userStore.userId, project.id)
      let tasksRef = getProjectTasksQuery(userStore.userId, project.id)

      // Apply pagination logic based on options
      tasksRef = applyPagination(tasksRef, next, prev, last, first)

      if (tasksRef) {
        // Clear the allTasksProject array before fetching new data
        allTasksProject.value = []

        // Subscribe to the new listener
        subscribeToTaskUpdates(tasksRef, allTasksProject)
      }
    } catch (error) {
      console.error('Error getting tasks:', error)
      notificationsStore.displaySnackbar(
        error.message || 'Failed to load tasks',
        'error',
        'mdi-close-circle'
      )
    }
  }

  // --- Filtering Control ---
  // Get filtered tasks paginated
  const getFilteredTasksPaginated = async ({
    next = false,
    prev = false,
    last = false,
    first = false
  } = {}) => {
    try {
      isLoading.value = true

      if (listeners.filteredTasks) listeners.filteredTasks() // Limpiar listener anterior
      // Verify if filters
      const hasValidFilters =
        searchTaskTitle.value?.trim()?.length > 0 ||
        selectedProjects.value?.length > 0 ||
        selectedPriorities.value?.length > 0 ||
        selectedStatuses.value?.length > 0 ||
        selectedLabels.value?.length > 0 ||
        selectedEndDate.value

      if (!hasValidFilters) {
        filteredTasks.value = []
        noResultsMessage.value = false
        return
      }

      // Define the base query for filtered tasks
      let tasksRef = getFilteredBaseQuery(userStore.userId)

      let q = query(tasksRef)

      // Apply filters only if they exist
      const filters = {
        searchTaskTitle: searchTaskTitle.value,
        selectedProjects: selectedProjects.value,
        selectedPriorities: selectedPriorities.value,
        selectedStatuses: selectedStatuses.value,
        selectedLabels: selectedLabels.value,
        selectedEndDate: selectedEndDate.value
      }

      q = applyFilters(q, filters)

      // Apply pagination logic based on options
      q = applyPagination(q, next, prev, last, first)

      if (q) {
        filteredTasks.value = []
        listeners.filteredTasks = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const taskData = createTaskData(change.doc)
            updateTaskArray(filteredTasks, change, taskData)
          })

          // Actualizar estado de paginación basado en snapshot
          lastVisibleTaskDoc.value = snapshot.docs[snapshot.docs.length - 1]
          firstVisibleTask.value = snapshot.docs[0]

          // Determinar si hay más páginas
          hasNextPage.value = snapshot.docs.length === pageSize
          hasPrevPage.value = currentPage.value > 1

          noResultsMessage.value = snapshot.empty

          allTasksProject.value = filteredTasks.value
        })
      }
    } catch (error) {
      // Handle errors
      notificationsStore.displaySnackbar(
        error.message || 'Error loading tasks',
        'error',
        'mdi-close-circle'
      )
      error.value = 'Error loading tasks'
    } finally {
      isLoading.value = false
    }
  }

  // --- Project Selection ---
  // Set the selected project title
  const setSelectedProject = (projectName) => {
    selectedProject.value = projectName // Store the project title
  }

  // --- Helper Actions ---
  // Helper function to validate user and project
  const validateProjectAndUser = async () => {
    if (!userStore.userId) {
      notificationsStore.displaySnackbar(
        'User ID is undefined. Please log in.',
        'error',
        'mdi-account-off'
      )
      return false
    }

    if (!selectedProject.value) {
      notificationsStore.displaySnackbar('No project selected.', 'error', 'mdi-alert-circle')
      console.warn('No project selected.')
      return false
    }

    const project = projectStore.projects.find((p) => p.title === selectedProject.value)
    if (!project?.id) {
      notificationsStore.displaySnackbar(
        'Project not found in local state',
        'error',
        'mdi-alert-circle'
      )
      return false
    }

    return project
  }

  // Helper function to update pagination state
  const updatePaginationState = (snapshot) => {
    lastVisibleTaskDoc.value = snapshot.docs[snapshot.docs.length - 1]
    firstVisibleTask.value = snapshot.docs[0]
    hasNextPage.value =
      // snapshot.docs.length === pageSize && currentPage.value < totalPagesInSelectedProject.value
      snapshot.docs.length === pageSize
    hasPrevPage.value = currentPage.value > 1
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
    console.log('Datos para paginación:', {
      isFilteredTasks,
      totalPages,
      tasksArrayLength: tasksArray.length
    })
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

  // Update the task array based on changes
  // This function updates the task array based on the type of change (added, modified, removed)
  // and the task data received from Firestore.
  const updateTaskArray = (taskArray, change, taskData) => {
    const index = taskArray.value.findIndex((task) => task.id === change.doc.id)

    switch (change.type) {
      case 'added':
        if (index === -1) {
          taskArray.value.push({
            ...taskData,
            projectColor: projectStore.projects.find((p) => p.id === taskData.projectId)?.color
          })
        }
        break

      case 'modified':
        if (index !== -1) {
          taskArray.value.splice(index, 1, {
            ...taskData,
            projectColor: projectStore.projects.find((p) => p.id === taskData.projectId)?.color
          })
        }
        break

      case 'removed':
        if (index !== -1) {
          taskArray.value.splice(index, 1)
        }
        break
    }
  }

  // Helper function to apply filters to a Firestore query
  const applyFilters = (q, filters) => {
    const filterConditions = {
      searchTaskTitle: (value) => {
        if (value?.trim()) {
          return where('title', '==', value.trim())
        }
        return null
      },
      selectedProjects: (value) => {
        if (value?.length > 0) {
          return where('project', 'in', value)
        }
        return null
      },
      selectedPriorities: (value) => {
        if (value?.length > 0) {
          return where('priority', 'in', value)
        }
        return null
      },
      selectedStatuses: (value) => {
        if (value?.length > 0) {
          return where('status', 'in', value)
        }
        return null
      },
      selectedLabels: (value) => {
        if (value?.length > 0) {
          return where('label', 'in', value)
        }
        return null
      },
      selectedEndDate: (value) => {
        if (value) {
          const { startOfDay, endOfDay } = getStartAndEndOfDay(value)
          return [where('endDate', '>=', startOfDay), where('endDate', '<=', endOfDay)]
        }
        return null
      }
    }

    Object.entries(filters).forEach(([key, value]) => {
      const condition = filterConditions[key](value)

      if (condition) {
        if (Array.isArray(condition)) {
          condition.forEach((c) => (q = query(q, c)))
        } else {
          q = query(q, condition)
        }
      }
    })

    return q
  }

  // --- Helper Actions ---
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

  // --- Filter Management ---
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

  // --- Store Management ---
  const unsubscribeAll = () => {
    Object.values(listeners).forEach((unsubscribe) => {
      if (unsubscribe) unsubscribe()
    })
    Object.assign(listeners, {
      tasks: null,
      projectTasks: null,
      filteredTasks: null
    })
  }

  // Clear the task store
  const clearTaskStore = () => {
    unsubscribeAll()
    tasksData.value = []
    selectedProject.value = null
    firstVisibleTask.value = null
    lastVisibleTaskDoc.value = null
    hasNextPage.value = true
    hasPrevPage.value = false
    currentPage.value = 1
    allTasksProject.value = []
    filteredTasks.value = []
    error.value = null
    noResultsMessage.value = false
    resetFilters()
  }

  // --- Watchers ---
  // Watch for changes in selected project or filters to reload tasks
  watch(
    () => ({
      selectedProject: selectedProject.value,
      searchTaskTitle: searchTaskTitle.value,
      selectedProjects: selectedProjects.value,
      selectedPriorities: selectedPriorities.value,
      selectedStatuses: selectedStatuses.value,
      selectedLabels: selectedLabels.value,
      selectedEndDate: selectedEndDate.value
    }),
    async (newVal, oldVal) => {
      // If the selected project changes
      if (newVal.selectedProject !== oldVal?.selectedProject) {
        if (newVal.selectedProject) {
          await getTasksByProjectPaginated()
        } else {
          await getFilteredTasksPaginated()
        }
      }

      // If there are changes in the filters and no project is selected
      if (
        !newVal.selectedProject &&
        (newVal.searchTaskTitle !== oldVal?.searchTaskTitle ||
          newVal.selectedProjects !== oldVal?.selectedProjects ||
          newVal.selectedPriorities !== oldVal?.selectedPriorities ||
          newVal.selectedStatuses !== oldVal?.selectedStatuses ||
          newVal.selectedLabels !== oldVal?.selectedLabels ||
          newVal.selectedEndDate !== oldVal?.selectedEndDate)
      ) {
        await getFilteredTasksPaginated()
      }
    },
    { immediate: true, deep: true }
  )

  // --- Lifecycle Hooks ---
  // Subscribe to tasks when the component is mounted
  onMounted(() => {
    subscribeToTasks()
  })

  return {
    // Actions (methods)
    applyFilters,
    applyPagination,
    clearTaskStore,
    completeTask,
    createTask,
    deleteAllTasks,
    deleteTask,
    editTask,
    getFilteredTasksPaginated,
    getProjectColor,
    getTask,
    getTasksByProjectPaginated,
    resetFilters,
    setSelectedProject,
    subscribeToTasks,
    unsubscribeAll,
    updateTask,
    // Getters (computed properties)
    colors,
    completedTasks,
    completedTasksInSelectedProject,
    editedTaskData,
    isSelectedProject,
    labels,
    newTaskData,
    pendingTasks,
    pendingTasksInSelectedProject,
    priorities,
    projectColor,
    projects,
    statuses,
    tasks,
    tasksInFilteredTasks,
    tasksInSelectedProject,
    totalPagesInFilteredTasks,
    totalPagesInSelectedProject,
    // Helper functions
    combineDateTime,
    convertTimestamp,
    createTaskData,
    // handleTaskSnapshot,
    handleAllTasksSnapshot,
    handleProjectTasksSnapshot,
    subscribeToTaskUpdates,
    updatePaginationState,
    updateTaskArray,
    validateProjectAndUser,
    validTaskForm,
    // Query Helpers
    getBaseTasksQuery,
    getFilteredBaseQuery,
    getProjectTasksQuery,
    // State
    allTasksProject,
    currentPage,
    dialogEditTask,
    error,
    filteredTasks,
    firstVisibleTask,
    hasNextPage,
    hasPrevPage,
    isSaving,
    lastVisibleTaskDoc,
    listeners,
    newTask,
    editedTask,
    noResultsMessage,
    pageSize,
    selectedEndDate,
    selectedLabels,
    selectedPriorities,
    selectedProject,
    selectedProjects,
    selectedStatuses,
    searchTaskTitle,
    tasksData
  }
})
