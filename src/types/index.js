/**
 * @typedef {Object} User
 * @property {string} uid - Unique identifier from Firebase Auth.
 * @property {string} email - User email.
 * @property {string} [displayName] - User display name.
 * @property {string} [photoURL] - User profile picture URL.
 * @property {Date} [lastLogin] - Last login timestamp.
 * @property {number} [loginCount] - Total number of logins.
 * @property {string[]} [createdTasks] - Array of task IDs created by the user.
 */

/**
 * @typedef {Object} Project
 * @property {string} id - Document ID in Firestore.
 * @property {string} title - Project title.
 * @property {string} description - Project description.
 * @property {string} color - Hex or Vuetify color name.
 * @property {string} userId - Owner's UID.
 * @property {import('firebase/firestore').Timestamp} createdAt - Creation timestamp.
 * @property {import('firebase/firestore').Timestamp} updatedAt - Last update timestamp.
 */

/**
 * @typedef {Object} Task
 * @property {string} id - Document ID in Firestore.
 * @property {string} projectId - Parent project ID.
 * @property {string} title - Task title.
 * @property {string} description - Task description.
 * @property {string} label - Task label (e.g., 'Work', 'Personal').
 * @property {string} priority - Task priority ('High', 'Medium', 'Low').
 * @property {string} status - Task status ('Pending', 'In Progress', 'Done').
 * @property {string|Date|import('firebase/firestore').Timestamp} startDate - Start date.
 * @property {string} [startDateHour] - Start hour (HH:mm).
 * @property {string|Date|import('firebase/firestore').Timestamp} endDate - Due date.
 * @property {string} [endDateHour] - Due hour (HH:mm).
 * @property {boolean} completed - Whether the task is finished.
 * @property {string} color - Task color (usually inherited from project).
 * @property {string} createdBy - Creator's UID.
 * @property {import('firebase/firestore').Timestamp} createdAt - Creation timestamp.
 * @property {import('firebase/firestore').Timestamp} updatedAt - Last update timestamp.
 */

export {}
