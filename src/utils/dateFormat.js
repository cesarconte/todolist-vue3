// src/utils/dateFormat.js

export function formatDate(date) {
  // Formatea la fecha al formato español: dd/mm/yyyy
  if (!date) return null
  const d = new Date(date)
  let day = '' + d.getDate()
  let month = '' + (d.getMonth() + 1)
  const year = d.getFullYear()

  if (day.length < 2) day = '0' + day
  if (month.length < 2) month = '0' + month

  return [day, month, year].join('/')
}
