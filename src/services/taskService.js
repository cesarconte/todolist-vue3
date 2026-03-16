/**
 * Servicio de dominio para operaciones relacionadas con tareas.
 * @module taskService
 */

import { db } from '@/config/firebase.js'
import {
  collection,
  query,
  where,
  orderBy,
  collectionGroup,
  getDocs,
  onSnapshot
} from 'firebase/firestore'
import { buildFirestoreFilters } from '@/utils/firestore/firestoreFilters.js'
import { buildPaginationQuery } from '@/utils/pagination/pagination.js'
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
import { useProjectStore } from '@/stores/projectStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import { showSnackbar } from '@/utils/notifications/notificationHelpers.js'

/**
 * Crea una nueva tarea.
 * @async
 * @param {import('@/types/index.js').Task} newTaskData - Datos de la nueva tarea.
 * @returns {Promise<string>} ID de la tarea creada.
 * @throws {Error} Si ocurre un error durante la creación.
 */
export async function createTask(newTaskData) {
  const userStore = useUserStore()
  const projectStore = useProjectStore()
  const notificationsStore = useNotificationsStore()

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
      createdAt: new Date(),
      updatedAt: new Date(),
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
    return docRef.id
  } catch (error) {
    showSnackbar(notificationsStore, error.message, 'error', 'mdi-alert-circle')
    throw error
  }
}

/**
 * Obtiene todas las tareas del usuario autenticado.
 * @async
 * @param {string} userId - ID del usuario.
 * @returns {Promise<Array<import('@/types/index.js').Task>>} Lista de tareas.
 */
export async function getAllUserTasks(userId) {
  try {
    const q = query(collectionGroup(db, 'tasks'), where('createdBy', '==', userId))
    const docs = await getCollection(q)
    return docs.map((doc) =>
      mapFirestoreTask({ data: () => doc, id: doc.id }, useProjectStore().getProjectById)
    )
  } catch (error) {
    throw new Error(`Error loading all tasks: ${error.message}`)
  }
}

/**
 * Obtiene tareas filtradas y paginadas.
 * @async
 * @param {Object} options - Opciones de filtrado y paginación.
 * @param {string} options.userId - ID del usuario.
 * @param {Object} [options.filters] - Filtros aplicables.
 * @param {number} [options.page=1] - Página actual.
 * @param {number} [options.pageSize=6] - Tamaño de página.
 * @returns {Promise<Object>} Objeto con tareas y metadatos de paginación.
 */
export async function getFilteredTasks({ userId, filters = {}, page = 1, pageSize = 6 }) {
  const projectStore = useProjectStore()
  const notificationsStore = useNotificationsStore()

  try {
    if (!userId) {
      throw new Error('Usuario no autenticado')
    }

    let q = query(collectionGroup(db, 'tasks'), where('createdBy', '==', userId))

    // Aplica todos los filtros de una vez
    const filterConditions = buildFirestoreFilters({ ...filters, pageSize, page })
    filterConditions.forEach((cond) => {
      q = query(q, cond)
    })

    // Ordenamiento: endDate, endDateHour, title (todos ascendente)
    q = query(q, orderBy('endDate', 'asc'), orderBy('endDateHour', 'asc'), orderBy('title', 'asc'))

    // Construir query paginada
    const tasksQuery = buildPaginationQuery({
      baseQuery: q,
      cursorType: 'first',
      state: { currentPage: page, pageSize }
    })
    const snapshot = await getDocs(tasksQuery)

    const tasks = snapshot.docs.map((doc) =>
      mapFirestoreTask({ data: () => doc, id: doc.id }, projectStore.getProjectById)
    )

    return {
      tasks,
      currentPage: page,
      pageSize,
      hasNextPage: snapshot.docs.length === pageSize,
      hasPrevPage: page > 1
    }
  } catch (error) {
    showSnackbar(notificationsStore, `Error loading tasks: ${error.message}`, 'error')
    throw error
  }
}

/**
 * Actualiza una tarea existente.
 * @async
 * @param {string} projectId - ID del proyecto.
 * @param {string} taskId - ID de la tarea.
 * @param {import('@/types/index.js').Task} updatedTaskData - Datos actualizados de la tarea.
 * @returns {Promise<void>}
 * @throws {Error} Si ocurre un error durante la actualización.
 */
export async function updateTask(projectId, taskId, updatedTaskData) {
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()

  try {
    if (!userStore.userId) throw new Error('Usuario no autenticado')
    if (!projectId || !taskId) throw new Error('Datos de tarea incompletos')

    const taskRef = collection(db, 'users', userStore.userId, 'projects', projectId, 'tasks').doc(
      taskId
    )

    const taskData = { ...updatedTaskData }
    delete taskData.id
    delete taskData.project

    // Combina fecha y hora si los campos de hora existen
    if (updatedTaskData.startDate && updatedTaskData.startDateHour) {
      taskData.startDate = combineDateTime(updatedTaskData.startDate, updatedTaskData.startDateHour)
    }
    if (updatedTaskData.endDate && updatedTaskData.endDateHour) {
      taskData.endDate = combineDateTime(updatedTaskData.endDate, updatedTaskData.endDateHour)
    }

    // Determinar si el estado es "Done" y actualizar el campo "completed"
    const isCompleted = updatedTaskData.status === 'Done'
    taskData.completed = isCompleted

    await updateDocument(taskRef, { ...taskData, updatedAt: new Date() })

    showSnackbar(notificationsStore, 'Task updated!', 'success', 'mdi-check-circle')
  } catch (error) {
    showSnackbar(notificationsStore, error.message, 'error', 'mdi-alert-circle')
    throw error
  }
}

/**
 * Elimina una tarea.
 * @async
 * @param {string} projectId - ID del proyecto.
 * @param {string} taskId - ID de la tarea.
 * @returns {Promise<void>}
 * @throws {Error} Si ocurre un error durante la eliminación.
 */
export async function deleteTask(projectId, taskId) {
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()

  try {
    if (!userStore.userId) throw new Error('Usuario no autenticado')
    if (!projectId || !taskId) throw new Error('Datos de tarea incompletos')

    const taskRef = collection(db, 'users', userStore.userId, 'projects', projectId, 'tasks').doc(
      taskId
    )

    // Verificar si la tarea existe antes de eliminarla
    const taskDoc = await getDocument(taskRef)
    if (!taskDoc) {
      throw new Error('Task not found')
    }

    // Eliminar la tarea de Firestore
    await deleteDocument(taskRef)

    showSnackbar(notificationsStore, 'Task deleted successfully', 'success', 'mdi-check-circle')
  } catch (error) {
    showSnackbar(
      notificationsStore,
      error.message || 'Error deleting task',
      'error',
      'mdi-close-circle'
    )
    throw error
  }
}

/**
 * Marca una tarea como completada o pendiente.
 * @async
 * @param {string} projectId - ID del proyecto.
 * @param {string} taskId - ID de la tarea.
 * @param {boolean} completed - Estado de completado.
 * @returns {Promise<void>}
 * @throws {Error} Si ocurre un error durante la actualización.
 */
export async function completeTask(projectId, taskId, completed) {
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()

  try {
    if (!userStore.userId) throw new Error('Usuario no autenticado')
    if (!projectId || !taskId) throw new Error('Datos de tarea incompletos')

    const taskRef = collection(db, 'users', userStore.userId, 'projects', projectId, 'tasks').doc(
      taskId
    )

    const newStatus = completed ? 'Done' : 'In Progress'

    await updateDocument(taskRef, {
      completed,
      status: newStatus,
      updatedAt: new Date()
    })

    showSnackbar(
      notificationsStore,
      `Task marked as ${completed ? 'completed' : 'in progress'}`,
      'success',
      completed ? 'mdi-check-circle' : 'mdi-progress-clock'
    )
  } catch (error) {
    showSnackbar(
      notificationsStore,
      error.message || 'Status update failed',
      'error',
      'mdi-close-circle'
    )
    throw error
  }
}

/**
 * Suscribe a un componente a cambios en tiempo real de tareas.
 * @param {string} userId - ID del usuario.
 * @param {Function} callback - Función de callback para manejar cambios.
 * @returns {Function} Función para cancelar la suscripción.
 */
export function subscribeToTasks(userId, callback) {
  if (!userId) return

  const q = query(collectionGroup(db, 'tasks'), where('createdBy', '==', userId))
  return onSnapshot(q, callback)
}
