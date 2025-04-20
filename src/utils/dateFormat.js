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

/**
 * Convierte una fecha en formato dd/MM/yyyy o yyyy-MM-dd a formato ISO yyyy-MM-dd
 * Si la entrada ya es ISO, la devuelve igual. Si es Date, la convierte a ISO.
 */
export function toISODate(date) {
  if (!date) return ''
  if (date instanceof Date) {
    // Devuelve solo la parte yyyy-MM-dd
    return date.toISOString().slice(0, 10)
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date // ya es ISO
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return date // fallback
}
