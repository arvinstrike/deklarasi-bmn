import { isAdminConfigured } from './firebase-admin'
import * as firestore from './store-firestore'
import * as memory from './store-memory'

// Firestore when a service account is configured (production), otherwise the
// in-memory fallback so local dev runs without credentials.
const impl = isAdminConfigured ? firestore : memory

export const getState = impl.getState
export const findByToken = impl.findByToken
export const confirmByToken = impl.confirmByToken
export const adminUpdateOfficial = impl.adminUpdateOfficial
export const adminDeleteOfficial = impl.adminDeleteOfficial
export const updateEvent = impl.updateEvent
export const resetAll = impl.resetAll
export const addOfficial = impl.addOfficial
export const saveDefaults = impl.saveDefaults
export const restoreDefaultsAll = impl.restoreDefaultsAll
export const restoreDefaultOne = impl.restoreDefaultOne
