export function mapFirestoreNotification(doc) {
  const data = doc.data ? doc.data() : doc
  let timestamp = data.timestamp

  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    timestamp = timestamp.toDate().toISOString()
  } else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    timestamp = new Date(timestamp.seconds * 1000).toISOString()
  }

  return {
    id: doc.id,
    ...data,
    timestamp,
    show: true
  }
}
