export function mapFirestoreProject(doc) {
  const data = doc.data ? doc.data() : doc
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    color: data.color,
    icon: data.icon,
    projectId: data.projectId,
    title: data.title,
    userId: data.userId
  }
}
