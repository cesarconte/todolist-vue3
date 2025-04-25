import { collection, query, where, orderBy, limit, startAfter } from 'firebase/firestore'
import { db } from '@/firebase'

export function buildNotificationQuery(userId, options = {}) {
  let q = collection(db, 'users', userId, 'notifications')
  let constraints = []

  if (options.unreadOnly) {
    constraints.push(where('read', '==', false))
  }
  constraints.push(orderBy(options.order || 'timestamp', 'desc'))

  if (options.lastVisible) {
    constraints.push(startAfter(options.lastVisible))
  }
  if (options.pageSize) {
    constraints.push(limit(options.pageSize))
  }

  return query(q, ...constraints)
}
