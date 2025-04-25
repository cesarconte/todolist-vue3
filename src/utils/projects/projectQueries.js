import { collection, query, where, orderBy, limit, startAfter } from 'firebase/firestore'
import { db } from '@/firebase'

export function buildProjectQuery(userId, options = {}) {
  let q = collection(db, 'users', userId, 'projects')
  let constraints = []

  if (options.title) {
    constraints.push(where('title', '==', options.title))
  }
  if (options.color) {
    constraints.push(where('color', '==', options.color))
  }
  constraints.push(orderBy(options.order || 'title', 'asc'))

  if (options.lastVisible) {
    constraints.push(startAfter(options.lastVisible))
  }
  if (options.pageSize) {
    constraints.push(limit(options.pageSize))
  }

  return query(q, ...constraints)
}
