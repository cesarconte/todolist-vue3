// taskStore.js

// 1. Imports
import { defineStore } from 'pinia'
import { computed, reactive, watch, ref } from 'vue'
import { db } from '../firebase.js'
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  collectionGroup,
  serverTimestamp,
  getDocs,
  onSnapshot
} from 'firebase/firestore'
import { useNotificationsStore } from './notificationsStore.js'
import { useProjectStore } from './projectStore.js'
import { useUserStore } from './userStore.js'
import { buildFirestoreFilters } from '@/utils/firestore/firestoreFilters.js'
import {
  buildPaginationQuery,
  getLastPageCount,
  getPaginationFlags
} from '@/utils/pagination/pagination.js'
import { mapFirestoreTask } from '@/utils/tasks/taskMappers.js'
import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument
} from '@/utils/firestore/firestoreCrud.js'
import { combineDateTime } from '@/utils/tasks/taskUtils.js'
import { toISODate } from '@/utils/date/dateFormat.js'
import { showSnackbar } from '@/utils/notifications/notificationHelpers.js' // Import the helper

// 2. Store principal
export const useTaskStore = defineStore('tasks', () => {
  // 2. Instancias de otras stores
  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()

  // 3. Estado reactivo
  const state = reactive({
    tasks: [],
    currentPage: 1,
    pageSize: 6,
    totalTasks: 0,
    lastVisible: null,
    firstVisible: null,
    hasNextPage: false,
    hasPrevPage: false,
    isLoading: false,
    error: null,
    initialLoadPending: true,
    // Filtros
    searchTerm: '',
    searchTitle: '', // Nuevo filtro para búsqueda por título
    selectedProjects: [],
    selectedPriorities: [],
    selectedStatuses: [],
    selectedLabels: [],
    selectedEndDate: null,
    selectedStartDate: null, // <-- Add new state for start date filter
    selectedCompletionStatus: null, // <-- Add new state for completion filter
    // Edición
    editingTask: null,
    isEditing: false,
    dialogEditTask: false,
    editedTask: null,
    newTask: {
      projectId: '',
      title: '',
      description: '',
      label: null,
      priority: null,
      status: null,
      startDate: null,
      endDate: null,
      startDateHour: '',
      endDateHour: '',
      completed: false,
      color: null
    }
  })

  // Estado para saber si estamos en la última página
  const isLastPageMode = ref(false)

  // --- Listeners para sincronización en tiempo real ---
  const listeners = reactive({
    tasks: null
  })

  // Computadas
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalFilteredTasks.value / state.pageSize))
  )

  // Computada para exponer los filtros de forma reactiva
  // --- Mejor solución: Computada para exponer filtros ---
  const currentFilters = computed(() => ({
    projects: state.selectedProjects,
    priorities: state.selectedPriorities,
    statuses: state.selectedStatuses,
    labels: state.selectedLabels,
    endDate: state.selectedEndDate,
    startDate: state.selectedStartDate,
    completionStatus: state.selectedCompletionStatus,
    searchTitle: state.searchTitle // Añadido
  }))

  // Computada para exponer las tareas de forma reactiva
  // --- Mejor solución: Computada para exponer tareas ---
  const tasksData = computed(() => state.tasks)

  // Computed para exponer dialogEditTask, editedTask y newTask de forma reactiva
  // --- Mejor solución: Computadas para dialogEditTask, editedTask y newTask ---
  const dialogEditTask = computed({
    get: () => state.dialogEditTask,
    set: (val) => {
      state.dialogEditTask = val
    }
  })
  const editedTask = computed({
    get: () => state.editedTask,
    set: (val) => {
      state.editedTask = val
    }
  })
  const newTask = computed({
    get: () => state.newTask,
    set: (val) => {
      state.newTask = val
    }
  })

  // --- Mejor solución: Getters reactivos para tareas del proyecto seleccionado ---
  const selectedProjectId = computed(() => state.selectedProjects[0] || null)

  const selectedProject = computed(() => {
    return projectStore.projects.find((p) => p.id === selectedProjectId.value) || null
  })

  const selectedProjectTitle = computed(() =>
    selectedProject.value ? selectedProject.value.title : ''
  )

  // --- Helpers para filtrar y paginar tareas ---
  function filterTasks(tasks, filters) {
    return tasks.filter((task) => {
      if (filters.projects.length && !filters.projects.includes(task.projectId)) return false
      if (filters.priorities.length && !filters.priorities.includes(task.priority)) return false
      if (filters.statuses.length && !filters.statuses.includes(task.status)) return false
      if (filters.labels.length && !filters.labels.includes(task.label)) return false
      if (filters.endDate && task.endDate) {
        // Comparar solo la fecha (sin hora)
        const taskDate = new Date(task.endDate)
        const filterDate = new Date(filters.endDate)
        if (
          taskDate.getFullYear() !== filterDate.getFullYear() ||
          taskDate.getMonth() !== filterDate.getMonth() ||
          taskDate.getDate() !== filterDate.getDate()
        ) {
          return false
        }
      }
      // Add client-side filtering for start date
      if (filters.startDate && task.startDate) {
        const taskDate = new Date(task.startDate)
        const filterDate = new Date(filters.startDate)
        if (
          taskDate.getFullYear() !== filterDate.getFullYear() ||
          taskDate.getMonth() !== filterDate.getMonth() ||
          taskDate.getDate() !== filterDate.getDate()
        ) {
          return false
        }
      }
      // Add client-side filtering for completion status
      if (filters.completionStatus !== null && task.completed !== filters.completionStatus) {
        return false
      }
      // Filtro por título (case-insensitive, incluye substring)
      if (filters.searchTitle && typeof filters.searchTitle === 'string') {
        const search = filters.searchTitle.trim().toLowerCase()
        if (!task.title?.toLowerCase().includes(search)) {
          return false
        }
      }
      return true
    })
  }

  function paginateTasks(tasks, page, pageSize) {
    const start = (page - 1) * pageSize
    return tasks.slice(start, start + pageSize)
  }

  // Todas las tareas filtradas (no paginadas)
  const allFilteredTasks = computed(() => filterTasks(state.tasks, currentFilters.value))

  // Tareas de la página actual (paginadas)
  const tasksPage = computed(() =>
    paginateTasks(allFilteredTasks.value, state.currentPage, state.pageSize)
  )

  // Tareas filtradas del proyecto seleccionado (no paginadas)
  const tasksInSelectedProject = computed(() => {
    if (!selectedProjectId.value) return []
    return allFilteredTasks.value.filter((task) => task.projectId === selectedProjectId.value)
  })

  // Tareas de la página actual y del proyecto seleccionado (paginadas y ordenadas)
  const paginatedTasksInSelectedProject = computed(() => {
    if (!selectedProjectId.value) return []
    // Ya no es necesario ordenar aquí, Firestore ya devuelve los datos ordenados
    return paginateTasks(tasksInSelectedProject.value, state.currentPage, state.pageSize)
  })

  // Totales globales filtrados (no paginados)
  const totalFilteredTasks = computed(() => allFilteredTasks.value.length)

  const completedFilteredTasks = computed(
    () => allFilteredTasks.value.filter((task) => task.completed).length
  )
  const remainingFilteredTasks = computed(
    () => allFilteredTasks.value.filter((task) => !task.completed).length
  )

  // Totales filtrados por proyecto seleccionado (no paginados)
  const totalFilteredTasksInProject = computed(() => tasksInSelectedProject.value.length)

  const completedFilteredTasksInProject = computed(
    () => tasksInSelectedProject.value.filter((task) => task.completed).length
  )

  const remainingFilteredTasksInProject = computed(
    () => tasksInSelectedProject.value.filter((task) => !task.completed).length
  )

  // 5. Métodos principales (CRUD, helpers)
  const buildQuery = (cursorType = 'first', noLimit = false) => {
    let q = query(collectionGroup(db, 'tasks'), where('createdBy', '==', userStore.userId))

    // Aplica todos los filtros de una vez
    const filterConditions = buildFirestoreFilters(state)
    filterConditions.forEach((cond) => {
      q = query(q, cond)
    })

    // Ordenamiento: endDate, endDateHour, title (todos ascendente)
    q = query(q, orderBy('endDate', 'asc'), orderBy('endDateHour', 'asc'), orderBy('title', 'asc'))

    // Centraliza la query de paginación
    return buildPaginationQuery({ baseQuery: q, cursorType, state, noLimit })
  }

  const fetchTasks = async (direction = 'first') => {
    if (!userStore.userId) {
      state.tasks = []
      state.totalTasks = 0
      state.currentPage = 1
      state.hasNextPage = false
      state.hasPrevPage = false
      state.isLoading = false
      return // Exit if no user is logged in
    }

    const wasInitialLoadPending = state.initialLoadPending && direction === 'first' // Check before starting

    try {
      state.isLoading = true
      state.error = null

      // Reinicia la página actual al cambiar de filtro
      if (direction === 'first') {
        state.currentPage = 1
      }

      // Obtener todas las tareas filtradas (no paginadas)
      const countQuery = buildQuery('first', true)
      const countSnapshot = await getCollection(countQuery)
      state.tasks = countSnapshot.map((doc) => mapFirestoreTask(doc, projectStore.getProjectById))
      state.totalTasks = state.tasks.length

      // Calcular totalPages después de actualizar totalTasks
      const totalPagesValue = Math.ceil(state.totalTasks / state.pageSize)

      // Construir query paginada
      const tasksQuery = buildQuery(direction)
      const snapshot = await getDocs(tasksQuery)

      if (snapshot.empty) {
        // Actualiza flags de paginación
        state.hasNextPage = false
        state.hasPrevPage = false
        return
      }

      // Si vamos a la última página, filtrar solo los documentos de la última página
      let docs = snapshot.docs
      if (direction === 'last') {
        isLastPageMode.value = true
        const lastPageCount = getLastPageCount(state.totalTasks, state.pageSize)
        docs = docs.slice(-lastPageCount)
      } else {
        isLastPageMode.value = false
      }

      // Después de cargar las tareas (por ejemplo, tras loadAllUserTasks o fetchTasks)

      // Actualizar cursores
      state.lastVisible = docs[docs.length - 1]
      state.firstVisible = docs[0]

      // Actualizar número de página ANTES de los logs
      if (direction === 'next') state.currentPage++
      if (direction === 'prev') state.currentPage--
      if (direction === 'first') state.currentPage = 1
      if (direction === 'last') state.currentPage = totalPagesValue || 1

      // Actualizar estado de paginación con el valor actualizado
      const flags = getPaginationFlags(state.currentPage, totalPagesValue)
      state.hasNextPage = flags.hasNextPage
      state.hasPrevPage = flags.hasPrevPage
    } catch (error) {
      state.error = error.message
      showSnackbar(notificationsStore, 'Error loading tasks', 'error')
    } finally {
      state.isLoading = false
      if (wasInitialLoadPending) {
        // Set pending to false only after the initial 'first' fetch completes
        state.initialLoadPending = false
      }
    }
  }

  // Acciones de paginación
  const nextPage = async () => {
    if (state.hasNextPage) {
      await fetchTasks('next')
    }
  }

  const prevPage = async () => {
    if (state.hasPrevPage) {
      // Si venimos de la última página, salimos del modo especial y navegamos normal
      if (isLastPageMode.value) {
        isLastPageMode.value = false
        await fetchTasks('prev')
      } else {
        await fetchTasks('prev')
      }
    }
  }

  const firstPage = async () => {
    await fetchTasks('first')
  }

  const lastPage = async () => {
    await fetchTasks('last')
    state.currentPage = totalPages.value || 1
  }

  const editTask = (taskId) => {
    const task = state.tasks.find((t) => t.id === taskId)
    if (task) {
      state.editedTask = { ...task }
      state.dialogEditTask = true
    }
  }

  const updateTask = async () => {
    try {
      const task = state.editedTask
      if (!task || !task.id || !task.projectId) throw new Error('Datos de tarea incompletos')
      const taskRef = doc(
        db,
        'users',
        userStore.userId,
        'projects',
        task.projectId,
        'tasks',
        task.id
      )
      const taskData = { ...task }
      delete taskData.id
      delete taskData.project

      // Combina fecha y hora si los campos de hora existen
      if (task.startDate && task.startDateHour) {
        taskData.startDate = combineDateTime(task.startDate, task.startDateHour)
      }
      if (task.endDate && task.endDateHour) {
        taskData.endDate = combineDateTime(task.endDate, task.endDateHour)
      }

      // Determinar si el estado es "Done" y actualizar el campo "completed"
      const isCompleted = task.status === 'Done'
      taskData.completed = isCompleted

      await updateDocument(taskRef, { ...taskData, updatedAt: serverTimestamp() })

      // Actualizar en el array reactivo
      const idx = state.tasks.findIndex((t) => t.id === task.id)
      if (idx !== -1) {
        state.tasks[idx] = { ...task }
        state.tasks[idx].completed = isCompleted
        // Actualizar también las fechas en el array reactivo
        if (taskData.startDate) state.tasks[idx].startDate = taskData.startDate
        if (taskData.endDate) state.tasks[idx].endDate = taskData.endDate
      }

      // --- REFRESCAR LISTA FILTRADA TRAS EDICIÓN ---
      await fetchTasks('first')

      state.dialogEditTask = false
      showSnackbar(notificationsStore, 'Task updated!', 'success', 'mdi-check-circle')
    } catch (error) {
      showSnackbar(notificationsStore, error.message, 'error', 'mdi-alert-circle')
    }
  }

  const resetFilters = () => {
    state.selectedProjects = []
    state.selectedPriorities = []
    state.selectedStatuses = []
    state.selectedLabels = []
    state.selectedEndDate = null
    state.selectedStartDate = null // <-- Reset the new filter
    state.selectedCompletionStatus = null // <-- Reset the new filter
    state.searchTerm = ''
    state.searchTitle = '' // <-- Reset the new filter
  }

  const createTask = async (newTaskData) => {
    try {
      if (!userStore.userId) throw new Error('Usuario no autenticado')
      if (!newTaskData.projectId) throw new Error('projectId es obligatorio')

      const project = projectStore.getProjectById(newTaskData.projectId)
      const color = project && project.color ? project.color : 'default'

      // Usa serverTimestamp() para Firestore
      const task = {
        ...newTaskData,
        color,
        startDate: toISODate(newTaskData.startDate),
        endDate: toISODate(newTaskData.endDate),
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userStore.userId
      }

      const tasksRef = collection(
        db,
        'users',
        userStore.userId,
        'projects',
        newTaskData.projectId,
        'tasks'
      )

      const docRef = await addDocument(tasksRef, task)
      showSnackbar(notificationsStore, 'Task created!', 'success', 'mdi-check-circle')
      await fetchTasks('first')
      return docRef.id
    } catch (error) {
      showSnackbar(notificationsStore, error.message, 'error', 'mdi-alert-circle')
      throw error
    }
  }

  const loadAllUserTasks = async () => {
    try {
      state.isLoading = true
      state.error = null
      state.tasks = []

      if (!userStore.userId) {
        return
      }

      const q = query(collectionGroup(db, 'tasks'), where('createdBy', '==', userStore.userId))
      const docs = await getCollection(q)

      state.tasks = docs.map((doc) =>
        mapFirestoreTask({ data: () => doc, id: doc.id }, projectStore.getProjectById)
      )
    } catch (error) {
      state.error = error.message
      showSnackbar(notificationsStore, 'Error loading all tasks', 'error')
    } finally {
      state.isLoading = false
    }
  }

  const clearTaskStore = () => {
    state.tasks = []
    state.currentPage = 1
    state.totalTasks = 0
    state.lastVisible = null
    state.firstVisible = null
    state.hasNextPage = false
    state.hasPrevPage = false
    state.isLoading = false
    state.error = null
    state.initialLoadPending = true // <--- RESET HERE
    state.searchTerm = ''
    state.searchTitle = '' // <--- RESET HERE
    state.selectedProjects = []
    state.selectedPriorities = []
    state.selectedStatuses = []
    state.selectedLabels = []
    state.selectedEndDate = null
    state.selectedStartDate = null // <--- RESET HERE
    state.editingTask = null
    state.isEditing = false
  }

  // Método para completar una tarea
  const completeTask = async (projectId, taskId) => {
    try {
      if (!projectId || !taskId) {
        showSnackbar(
          notificationsStore,
          'Project ID or Task ID is undefined',
          'error',
          'mdi-alert-circle'
        )
        return
      }

      const taskRef = doc(db, 'users', userStore.userId, 'projects', projectId, 'tasks', taskId)
      const taskDoc = await getDocument(taskRef)

      if (!taskDoc) {
        throw new Error('Task not found')
      }

      const currentStatus = taskDoc.completed
      const newStatus = !currentStatus

      await updateDocument(taskRef, {
        completed: newStatus,
        status: newStatus ? 'Done' : 'In Progress',
        updatedAt: serverTimestamp()
      })

      showSnackbar(
        notificationsStore,
        `Task marked as ${newStatus ? 'completed' : 'in progress'}`,
        'success',
        newStatus ? 'mdi-check-circle' : 'mdi-progress-clock'
      )

      // Actualizar la tarea en el array reactivo
      const taskIndex = state.tasks.findIndex((task) => task.id === taskId)
      if (taskIndex !== -1) {
        state.tasks[taskIndex].completed = newStatus
        state.tasks[taskIndex].status = newStatus ? 'Done' : 'In Progress'
      }
      // --- REFRESCAR LISTA FILTRADA TRAS COMPLETAR ---
      await fetchTasks('first')
    } catch (error) {
      showSnackbar(
        notificationsStore,
        error.message || 'Status update failed',
        'error',
        'mdi-close-circle'
      )
    }
  }

  // Método para eliminar una tarea
  const deleteTask = async (projectId, taskId) => {
    try {
      if (!projectId || !taskId) {
        showSnackbar(
          notificationsStore,
          'Project ID or Task ID is undefined',
          'error',
          'mdi-alert-circle'
        )
        return
      }

      const taskRef = doc(db, 'users', userStore.userId, 'projects', projectId, 'tasks', taskId)

      // Verificar si la tarea existe antes de eliminarla
      const taskDoc = await getDocument(taskRef)
      if (!taskDoc) {
        throw new Error('Task not found')
      }

      // Eliminar la tarea de Firestore
      await deleteDocument(taskRef)

      // Eliminar la tarea del array reactivo
      state.tasks = state.tasks.filter((task) => task.id !== taskId)

      showSnackbar(notificationsStore, 'Task deleted successfully', 'success', 'mdi-check-circle')
      // --- REFRESCAR LISTA FILTRADA TRAS ELIMINAR ---
      await fetchTasks('first')
    } catch (error) {
      showSnackbar(
        notificationsStore,
        error.message || 'Error deleting task',
        'error',
        'mdi-close-circle'
      )
    }
  }

  // Añadir método para seleccionar un proyecto desde la UI
  const setSelectedProject = (projectId) => {
    if (!projectId) {
      if (state.selectedProjects.length > 0) {
        // Only reset if it actually changes to empty
        state.selectedProjects = []
        state.initialLoadPending = true // <--- RESET HERE
      }
      return
    }
    if (!state.selectedProjects.includes(projectId)) {
      // Only reset if the project ID actually changes
      state.selectedProjects = [projectId]
      state.initialLoadPending = true // <--- RESET HERE
    }
  }

  // Setter para búsqueda por título
  function setSearchTitle(title) {
    state.searchTitle = title
  }

  // Suscribirse a los cambios en tiempo real de las tareas del usuario
  const subscribeToTasks = () => {
    if (!userStore.userId) return
    // Limpiar listener anterior si existe
    if (listeners.tasks) listeners.tasks()

    const q = query(collectionGroup(db, 'tasks'), where('createdBy', '==', userStore.userId))
    listeners.tasks = onSnapshot(
      q,
      (snapshot) => {
        // Use a Map to prevent duplicates based on ID during mapping
        const taskMap = new Map()
        snapshot.docs.forEach((doc) => {
          const mappedTask = mapFirestoreTask(
            { data: () => (typeof doc.data === 'function' ? doc.data() : doc), id: doc.id },
            projectStore.getProjectById
          )
          if (mappedTask && mappedTask.id) {
            // Ensure task and id exist
            taskMap.set(mappedTask.id, mappedTask)
          }
        })
        state.tasks = Array.from(taskMap.values())
      },
      (error) => {
        // Manejo correcto del error recibido
        const msg = error && error.message ? error.message : 'Error listening to task updates.'
        state.error = msg
        showSnackbar(notificationsStore, msg, 'error')
      }
    )
  }

  // Limpiar todos los listeners activos
  const unsubscribeAll = () => {
    Object.values(listeners).forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') unsubscribe()
    })
    listeners.tasks = null
  }

  // Watcher para cambios en filtros Y userId
  watch(
    () => ({ filters: { ...currentFilters.value }, userId: userStore.userId }),
    async (newValue, oldValue) => {
      const filtersChanged = JSON.stringify(newValue.filters) !== JSON.stringify(oldValue?.filters)
      const userChanged = newValue.userId !== oldValue?.userId
      const hasSelectedProject = newValue.filters.projects.length > 0 // Check specifically for selected project

      // Condition 1: User is logged in AND a project is selected
      if (newValue.userId && hasSelectedProject) {
        // Trigger fetch if user just logged in (with a project selected) OR if filters changed while logged in (and project still selected)
        if (userChanged || filtersChanged) {
          await fetchTasks('first')
        }
      }
      // Condition 2: User logged in BUT no project selected (or filters cleared)
      else if (newValue.userId && !hasSelectedProject && filtersChanged) {
        // Recarga la lista filtrada y paginada aunque no haya proyecto seleccionado
        await fetchTasks('first')
      }
      // Condition 3: User logged out (or became null)
      else if (userChanged && !newValue.userId) {
        // Clear all task-related state on logout
        clearTaskStore() // Use the existing clear function
        unsubscribeAll() // Ensure listener is cleaned up
      }
    },
    { deep: true, immediate: true } // Run immediately on store setup
  )

  // 6. Return
  return {
    state,
    totalPages,
    currentFilters,
    tasksData,
    dialogEditTask,
    editedTask,
    newTask,
    // Arrays globales y paginados
    allFilteredTasks,
    tasksPage,
    // Totales globales filtrados
    totalFilteredTasks,
    completedFilteredTasks,
    remainingFilteredTasks,
    // Totales filtrados por proyecto seleccionado
    tasksInSelectedProject,
    totalFilteredTasksInProject,
    completedFilteredTasksInProject,
    remainingFilteredTasksInProject,
    paginatedTasksInSelectedProject,
    selectedProjectId,
    selectedProject,
    selectedProjectTitle,
    isLastPageMode,
    listeners,
    buildQuery,
    fetchTasks,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    editTask,
    updateTask,
    resetFilters,
    createTask,
    loadAllUserTasks,
    clearTaskStore,
    completeTask,
    deleteTask,
    setSelectedProject,
    setSearchTitle,
    subscribeToTasks,
    unsubscribeAll
  }
})
