import { adminDb } from './firebase-admin'
import { ROSTER, EVENT } from './roster'
import type { BoardState, EventInfo, Official } from './types'

// Namespaced so this app can share the Firebase project with the old one
// without clobbering its `officials` / `event/main` collections.
const OFFICIALS = 'deklarasi_officials'
const DEFAULTS = 'deklarasi_defaults'
const EVENT_DOC = 'deklarasi_meta/event'

type OfficialDoc = Omit<Official, 'id'>

function randomToken(): string {
  return Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 36).toString(36),
  ).join('')
}

// Strip transient state — a default is the clean baseline of a roster entry.
function pristine(o: OfficialDoc): OfficialDoc {
  return {
    order: o.order,
    name: o.name,
    position: o.position,
    photo: o.photo,
    token: o.token,
    phone: o.phone ?? null,
    confirmed: false,
    confirmed_at: null,
    hidden: false,
    wa_status: null,
  }
}

// Seed the roster into Firestore once (first run). Confirmation state then lives
// on each official doc, so the admin can edit/delete officials later.
// `seeded` short-circuits the check per warm instance — no extra round trip.
let seeded = false
async function ensureSeeded() {
  if (seeded) return
  const db = adminDb()
  const existing = await db.collection(OFFICIALS).limit(1).get()
  if (!existing.empty) {
    seeded = true
    return
  }
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
      phone: null,
      wa_status: null,
      hidden: false,
    } satisfies OfficialDoc)
  })
  await batch.commit()
  seeded = true
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

export async function adminUpdateOfficial(
  id: string,
  patch: Partial<OfficialDoc>,
): Promise<void> {
  await adminDb().collection(OFFICIALS).doc(id).update(patch)
}

export async function adminDeleteOfficial(id: string): Promise<void> {
  await adminDb().collection(OFFICIALS).doc(id).delete()
}

export async function updateEvent(patch: Partial<EventInfo>): Promise<void> {
  await adminDb().doc(EVENT_DOC).set(patch, { merge: true })
}

export async function resetAll(): Promise<void> {
  const db = adminDb()
  const snap = await db.collection(OFFICIALS).get()
  const batch = db.batch()
  snap.docs.forEach((d) =>
    batch.update(d.ref, { confirmed: false, confirmed_at: null }),
  )
  await batch.commit()
}

export async function addOfficial(data: {
  name: string
  position: string
  phone?: string | null
}): Promise<Official> {
  const db = adminDb()
  const all = await db.collection(OFFICIALS).get()
  const maxOrder = all.docs.reduce(
    (m, d) => Math.max(m, (d.data().order as number) || 0),
    0,
  )
  const ref = db.collection(OFFICIALS).doc()
  const doc: OfficialDoc = {
    order: maxOrder + 1,
    name: data.name,
    position: data.position,
    photo: '',
    token: randomToken(),
    phone: data.phone ?? null,
    confirmed: false,
    confirmed_at: null,
    hidden: false,
    wa_status: null,
  }
  await ref.set(doc)
  return { id: ref.id, ...doc }
}

// Snapshot the current roster as the restore baseline.
export async function saveDefaults(): Promise<void> {
  const db = adminDb()
  const [work, defs] = await Promise.all([
    db.collection(OFFICIALS).get(),
    db.collection(DEFAULTS).get(),
  ])
  const batch = db.batch()
  defs.docs.forEach((d) => batch.delete(d.ref))
  work.docs.forEach((d) =>
    batch.set(db.collection(DEFAULTS).doc(d.id), pristine(d.data() as OfficialDoc)),
  )
  await batch.commit()
}

// Restore everything to the saved default: unhide, revert edits, drop added
// officials, bring back removed/hidden ones, clear confirmations.
export async function restoreDefaultsAll(): Promise<void> {
  const db = adminDb()
  const [work, defs] = await Promise.all([
    db.collection(OFFICIALS).get(),
    db.collection(DEFAULTS).get(),
  ])
  if (defs.empty) return
  const defIds = new Set(defs.docs.map((d) => d.id))
  const batch = db.batch()
  work.docs.forEach((d) => {
    if (!defIds.has(d.id)) batch.delete(d.ref)
  })
  defs.docs.forEach((d) =>
    batch.set(db.collection(OFFICIALS).doc(d.id), d.data()),
  )
  await batch.commit()
}

// Restore one official to default; if it was an added one, remove it.
export async function restoreDefaultOne(id: string): Promise<void> {
  const db = adminDb()
  const def = await db.collection(DEFAULTS).doc(id).get()
  if (def.exists) await db.collection(OFFICIALS).doc(id).set(def.data()!)
  else await db.collection(OFFICIALS).doc(id).delete()
}
