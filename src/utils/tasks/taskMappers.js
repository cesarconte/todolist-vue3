import { convertTimestamp } from './taskUtils.js'

export function mapFirestoreTask(doc, getProjectById) {
  // Permite tanto documentos Firestore como objetos planos
  const data = typeof doc.data === 'function' ? doc.data() : doc
  let project = getProjectById ? getProjectById(data.projectId) : undefined
  if (!project) {
    project = { id: data.projectId, title: 'Unknown', color: 'grey', icon: 'mdi-folder-question' }
  }
  return {
    id: doc.id || data.id,
    ...data,
    startDate: convertTimestamp(data.startDate),
    endDate: convertTimestamp(data.endDate),
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    project
  }
}
