import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

// One env var holds the whole service-account JSON (minified). Works the same
// locally (.env) and on Vercel. JSON.parse turns the key's \n into real
// newlines, so no manual escaping needed.
export const isAdminConfigured = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT)

let db: Firestore | undefined

export function adminDb(): Firestore {
  if (!db) {
    if (!isAdminConfigured) throw new Error('FIREBASE_SERVICE_ACCOUNT not set')
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)
    const app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: sa.project_id,
            clientEmail: sa.client_email,
            privateKey: sa.private_key,
          }),
        })
    db = getFirestore(app)
  }
  return db
}
