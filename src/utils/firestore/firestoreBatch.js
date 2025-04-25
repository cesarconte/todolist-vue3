import { writeBatch } from 'firebase/firestore'

/**
 * Elimina en batch una lista de referencias de documentos Firestore.
 * @param {object} db - Instancia de Firestore.
 * @param {Array} docRefs - Array de referencias de documentos a eliminar.
 * @returns {Promise<void>}
 */
export async function batchDeleteDocuments(db, docRefs) {
  const batch = writeBatch(db)
  docRefs.forEach((ref) => batch.delete(ref))
  await batch.commit()
}
