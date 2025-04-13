//taskUtils.js

import { Timestamp } from 'firebase/firestore'

// Helper function to convert Timestamps to Date objects
export const convertTimestamp = (field) => (field instanceof Timestamp ? field.toDate() : field)

// Helper function to combine date and time
export const combineDateTime = (date, time) => {
  if (!date || !time) return null // Handle null or undefined values

  const [hours, minutes] = time.split(':').map(Number)
  const dateTime = new Date(date)
  dateTime.setHours(hours, minutes, 0, 0)
  return dateTime
}

// Helper function to create start and end of day Date objects
export const getStartAndEndOfDay = (date) => {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return { startOfDay: start, endOfDay: end }
}

// Helper function to create task data object
export const createTaskData = (doc) => ({
  id: doc.id,
  ...doc.data(),
  projectId: doc.ref.parent.parent?.id,
  projectPath: doc.ref.parent.parent?.id
})
