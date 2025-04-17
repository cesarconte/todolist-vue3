import { convertTimestamp } from './taskUtils.js'

export function mapFirestoreTask(doc, getProjectById) {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    endDate: convertTimestamp(data.endDate),
    startDate: convertTimestamp(data.startDate),
    project: getProjectById ? getProjectById(data.projectId) : undefined
  }
}
