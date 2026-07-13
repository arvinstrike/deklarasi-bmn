import { adminDb } from './firebase-admin'
import { ROSTER, EVENT } from './roster'
import type { BoardState, EventInfo, Official } from './types'

// Namespaced so this app can share the Firebase project with the old one
// without clobbering its `officials` / `event/main` collections.
const OFFICIALS = 'deklarasi_officials'
const EVENT_DOC = 'deklarasi_meta/event'

type OfficialDoc = Omit<Official, 'id'>

// Seed the roster into Firestore once (first run). Confirmation state then lives
// on each official doc, so the admin can edit/delete officials later.
async function ensureSeeded() {
  const db = adminDb()
  const existing = await db.collection(OFFICIALS).limit(1).get()
  if (!existing.empty) return
  const batch = db.batch()
  batch.set(db.doc(EVENT_DOC), EVENT)
  ROSTER.forEach((r, i) => {
    batch.set(db.collection(OFFICIALS).doc(`o${i + 1}`), {
      order: i + 1,
      name: r.name,
      position: r.position,
      photo: r.photo,
      token: r.token,
      confirmed: false,
      confirmed_at: null,
    } satisfies OfficialDoc)
  })
  await batch.commit()
}

export async function getState(): Promise<BoardState> {
  const db = adminDb()
  await ensureSeeded()
  const [eventSnap, officialsSnap] = await Promise.all([
    db.doc(EVENT_DOC).get(),
    db.collection(OFFICIALS).orderBy('order').get(),
  ])
  const event = (eventSnap.exists ? eventSnap.data() : EVENT) as EventInfo
  const officials = officialsSnap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as OfficialDoc) }),
  )
  return { event, officials }
}

export async function findByToken(token: string): Promise<Official | null> {
  const db = adminDb()
  const snap = await db
    .collection(OFFICIALS)
    .where('token', '==', token)
    .limit(1)
    .get()
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...(d.data() as OfficialDoc) }
}

export async function confirmByToken(token: string): Promise<Official | null> {
  const db = adminDb()
  const snap = await db
    .collection(OFFICIALS)
    .where('token', '==', token)
    .limit(1)
    .get()
  if (snap.empty) return null
  const ref = snap.docs[0].ref
  const data = snap.docs[0].data() as OfficialDoc
  if (!data.confirmed) {
    await ref.update({ confirmed: true, confirmed_at: Date.now() })
  }
  const fresh = await ref.get()
  return { id: fresh.id, ...(fresh.data() as OfficialDoc) }
}

export async function unconfirmByToken(token: string): Promise<boolean> {
  const db = adminDb()
  const snap = await db
    .collection(OFFICIALS)
    .where('token', '==', token)
    .limit(1)
    .get()
  if (snap.empty) return false
  await snap.docs[0].ref.update({ confirmed: false, confirmed_at: null })
  return true
}
