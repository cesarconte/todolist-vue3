/**
 * Servicio de dominio para operaciones relacionadas con proyectos.
 * @module projectService
 */

import { db } from '@/config/firebase.js'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore'
import {
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument
} from '@/utils/firestore/firestoreCrud.js'
import { mapFirestoreProject } from '@/utils/projects/projectMappers.js'
import { batchDeleteDocuments } from '@/utils/firestore/firestoreBatch.js'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import { showSnackbar } from '@/utils/notifications/notificationHelpers.js'

/**
 * Crea un nuevo proyecto.
 * @async
 * @param {string} userId - ID del usuario.
 * @param {Object} projectData - Datos del proyecto.
 * @returns {Promise<string>} ID del documento creado.
 */
export async function createProject(userId, projectData) {
  const notificationsStore = useNotificationsStore()

  try {
    const projectPayload = {
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      projectId: projectData.title.toLowerCase().replace(/\s/g, '-'),
      userId
    }

    const docRef = await addDocument(collection(db, 'users', userId, 'projects'), projectPayload)

    showSnackbar(notificationsStore, 'Project created!', 'success', 'mdi-check-circle')
    return docRef.id
  } catch (error) {
    showSnackbar(notificationsStore, error.message, 'error', 'mdi-alert-circle')
    throw error
  }
}

/**
 * Actualiza un proyecto existente.
 * @async
 * @param {string} userId - ID del usuario.
 * @param {string} projectId - ID del proyecto.
 * @param {Object} projectData - Datos actualizados del proyecto.
 * @returns {Promise<void>}
 */
export async function updateProject(userId, projectId, projectData) {
  const notificationsStore = useNotificationsStore()

  try {
    const projectRef = doc(db, 'users', userId, 'projects', projectId)
    const projectDoc = await getDocument(projectRef)

    if (!projectDoc || projectDoc.userId !== userId) {
      throw new Error('Project not found or unauthorized')
    }

    const updatePayload = {
      ...projectData,
      updatedAt: serverTimestamp(),
      projectId: projectData.title.toLowerCase().replace(/\s/g, '-')
    }

    await updateDocument(projectRef, updatePayload)

    // Actualizar el color de todas las tareas del proyecto
    if (projectData.color) {
      const tasksQuery = query(collection(db, 'users', userId, 'projects', projectId, 'tasks'))
      const tasksSnapshot = await getDocs(tasksQuery)

      if (!tasksSnapshot.empty) {
        const batch = writeBatch(db)
        tasksSnapshot.forEach((taskDoc) => {
          batch.update(taskDoc.ref, { color: projectData.color })
        })
        await batch.commit()
      }
    }

    showSnackbar(notificationsStore, 'Project updated!', 'success', 'mdi-check-circle')
  } catch (error) {
    showSnackbar(notificationsStore, error.message, 'error', 'mdi-alert-circle')
    throw error
  }
}

/**
 * Elimina un proyecto y todas sus tareas/asociaciones.
 * @async
 * @param {string} userId - ID del usuario.
 * @param {string} projectId - ID del proyecto.
 * @returns {Promise<void>}
 */
export async function deleteProject(userId, projectId) {
  const notificationsStore = useNotificationsStore()

  try {
    const projectRef = doc(db, 'users', userId, 'projects', projectId)
    const projectDoc = await getDocument(projectRef)

    if (!projectDoc) {
      throw new Error('Project not found')
    }

    // 1. Eliminar tareas
    const tasksQuery = query(collection(db, 'users', userId, 'projects', projectId, 'tasks'))
    const tasksSnapshot = await getDocs(tasksQuery)

    const batch = writeBatch(db)
    const notificationsToDeleteRefs = []

    for (const taskDoc of tasksSnapshot.docs) {
      const taskId = taskDoc.id
      batch.delete(taskDoc.ref)

      // Buscar notificaciones asociadas a la tarea
      const notificationsQuery = query(
        collection(db, 'users', userId, 'notifications'),
        where('taskId', '==', taskId)
      )
      const notificationsSnapshot = await getDocs(notificationsQuery)
      notificationsSnapshot.forEach((notificationDoc) => {
        notificationsToDeleteRefs.push(notificationDoc.ref)
      })
    }

    // Eliminar notificaciones en batch
    if (notificationsToDeleteRefs.length > 0) {
      await batchDeleteDocuments(db, notificationsToDeleteRefs)
    }

    await batch.commit()

    // 2. Eliminar el proyecto
    await deleteDocument(projectRef)

    showSnackbar(
      notificationsStore,
      'Project, its tasks, and related notifications deleted successfully',
      'success',
      'mdi-check-circle'
    )
  } catch (error) {
    showSnackbar(notificationsStore, error.message, 'error', 'mdi-alert-circle')
    throw error
  }
}

/**
 * Elimina todas las tareas de un proyecto.
 * @async
 * @param {string} userId - ID del usuario.
 * @param {string} projectId - ID del proyecto.
 * @returns {Promise<void>}
 */
export async function deleteAllTasksInProject(userId, projectId) {
  const notificationsStore = useNotificationsStore()

  try {
    const projectRef = doc(db, 'users', userId, 'projects', projectId)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists() || projectDoc.data().userId !== userId) {
      throw new Error('Project not found or unauthorized')
    }

    const batch = writeBatch(db)
    const tasksQuery = query(collection(db, 'users', userId, 'projects', projectId, 'tasks'))
    const tasksSnapshot = await getDocs(tasksQuery)

    const taskIds = []
    const notificationsToDelete = []

    for (const taskDoc of tasksSnapshot.docs) {
      const taskId = taskDoc.id
      taskIds.push(taskId)
      batch.delete(taskDoc.ref)

      const notificationsQuery = query(
        collection(db, 'users', userId, 'notifications'),
        where('taskId', '==', taskId)
      )
      const notificationsSnapshot = await getDocs(notificationsQuery)
      notificationsSnapshot.forEach((doc) => notificationsToDelete.push(doc.ref))
    }

    if (notificationsToDelete.length > 0) {
      await batchDeleteDocuments(db, notificationsToDelete)
    }

    await batch.commit()

    showSnackbar(
      notificationsStore,
      'All tasks deleted successfully',
      'success',
      'mdi-check-circle'
    )
  } catch (error) {
    showSnackbar(notificationsStore, error.message, 'error', 'mdi-alert-circle')
    throw error
  }
}

/**
 * Suscribe a cambios en tiempo real de proyectos.
 * @param {string} userId - ID del usuario.
 * @param {Function} callback - Callback para manejar cambios.
 * @returns {Function} Función para cancelar la suscripción.
 */
export function subscribeToProjects(userId, callback) {
  if (!userId) return

  const collectionRef = query(collection(db, 'users', userId, 'projects'), orderBy('title', 'asc'))

  return onSnapshot(collectionRef, (snapshot) => {
    const projects = snapshot.docs.map((doc) => mapFirestoreProject(doc))
    callback(projects)
  })
}
