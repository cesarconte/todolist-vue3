export function mapFirestoreNotification(doc) {
  const data = doc.data ? doc.data() : doc
  return {
    id: doc.id,
    ...data,
    timestamp: data.timestamp,
    show: true
  }
}
