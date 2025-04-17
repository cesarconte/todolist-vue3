import { query, startAfter, endBefore, limit, limitToLast } from 'firebase/firestore'

export function getLastPageCount(total, pageSize) {
  return total % pageSize === 0 ? pageSize : total % pageSize
}

export function getPaginationFlags(currentPage, totalPages) {
  return {
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }
}

/**
 * Centraliza la construcción de la query de paginación.
 * @param {object} params
 * @param {object} baseQuery - Query base de Firestore (ya con filtros y orden).
 * @param {string} cursorType - 'first', 'next', 'prev', 'last'.
 * @param {object} state - Estado con cursores y pageSize.
 * @param {boolean} noLimit - Si true, no aplica paginación.
 * @returns {object} Query de Firestore lista para paginar.
 */
export function buildPaginationQuery({ baseQuery, cursorType = 'first', state, noLimit = false }) {
  if (noLimit) return baseQuery
  switch (cursorType) {
    case 'next':
      return query(baseQuery, startAfter(state.lastVisible), limit(state.pageSize))
    case 'prev':
      return query(baseQuery, endBefore(state.firstVisible), limitToLast(state.pageSize))
    case 'last':
      return query(baseQuery, limitToLast(state.pageSize))
    default:
      return query(baseQuery, limit(state.pageSize))
  }
}
