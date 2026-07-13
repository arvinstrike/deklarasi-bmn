import { adminDb } from './firebase-admin'
import { ROSTER, EVENT } from './roster'
import type { BoardState, EventInfo, Official } from './types'

// Single aggregate doc + short server cache. The board polls every 2s; reading
// one small doc (cached) instead of 24 per-official docs keeps Firestore reads
// ~30x lower — the whole roster fits well under the 1 MiB doc limit.
const DOC = 'deklarasi_state/main'
const CACHE_MS = 4000

type StateDoc = { event: EventInfo; officials: Official[]; defaults: Official[] }

function seed(): StateDoc {
  const officials: Official[] = ROSTER.map((r, i) => ({
    id: `o${i + 1}`,
    order: i + 1,
    name: r.name,
    position: r.position,
    photo: r.photo,
    token: r.token,
    phone: null,
    confirmed: false,
    confirmed_at: null,
    hidden: false,
    wa_status: null,
  }))
  return { event: { ...EVENT }, officials, defaults: [] }
}

function pristine(o: Official): Official {
  return { ...o, confirmed: false, confirmed_at: null, hidden: false, wa_status: null }
}

let cache: { data: StateDoc; at: number } | null = null

async function read(useCache = true): Promise<StateDoc> {
  if (useCache && cache && Date.now() - cache.at < CACHE_MS) return cache.data
  const ref = adminDb().doc(DOC)
  const snap = await ref.get()
  let data: StateDoc
  if (!snap.exists) {
    data = seed()
    await ref.set(data)
  } else {
    data = snap.data() as StateDoc
  }
  cache = { data, at: Date.now() }
  return data
}

// Transaction read-modify-write (fresh, no lost updates), then refresh cache.
async function mutate(fn: (d: StateDoc) => void): Promise<StateDoc> {
  const ref = adminDb().doc(DOC)
  const data = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const d: StateDoc = snap.exists ? (snap.data() as StateDoc) : seed()
    fn(d)
    tx.set(ref, d)
    return d
  })
  cache = { data, at: Date.now() }
  return data
}

export async function getState(): Promise<BoardState> {
  const d = await read()
  return { event: d.event, officials: [...d.officials].sort((a, b) => a.order - b.order) }
}

export async function findByToken(token: string): Promise<Official | null> {
  const d = await read()
  return d.officials.find((o) => o.token === token) ?? null
}

export async function confirmByToken(token: string): Promise<Official | null> {
  let result: Official | null = null
  await mutate((d) => {
    const o = d.officials.find((x) => x.token === token)
    if (!o) return
    if (!o.confirmed) {
      o.confirmed = true
      o.confirmed_at = Date.now()
    }
    result = o
  })
  return result
}

export async function adminUpdateOfficial(
  id: string,
  patch: Partial<Official>,
): Promise<void> {
  await mutate((d) => {
    const o = d.officials.find((x) => x.id === id)
    if (o) Object.assign(o, patch)
  })
}

export async function adminDeleteOfficial(id: string): Promise<void> {
  await mutate((d) => {
    d.officials = d.officials.filter((o) => o.id !== id)
  })
}

export async function updateEvent(patch: Partial<EventInfo>): Promise<void> {
  await mutate((d) => {
    d.event = { ...d.event, ...patch }
  })
}

export async function resetAll(): Promise<void> {
  await mutate((d) => {
    d.officials = d.officials.map((o) => ({ ...o, confirmed: false, confirmed_at: null }))
  })
}

export async function addOfficial(data: {
  name: string
  position: string
  phone?: string | null
}): Promise<Official> {
  let created: Official | null = null
  await mutate((d) => {
    const maxOrder = d.officials.reduce((m, o) => Math.max(m, o.order), 0)
    created = {
      id: 'a' + Date.now().toString(36),
      order: maxOrder + 1,
      name: data.name,
      position: data.position,
      photo: '',
      token: Math.random().toString(36).slice(2, 10),
      phone: data.phone ?? null,
      confirmed: false,
      confirmed_at: null,
      hidden: false,
      wa_status: null,
    }
    d.officials.push(created)
  })
  return created!
}

export async function saveDefaults(): Promise<void> {
  await mutate((d) => {
    d.defaults = d.officials.map(pristine)
  })
}

export async function restoreDefaultsAll(): Promise<void> {
  await mutate((d) => {
    if (d.defaults.length) d.officials = d.defaults.map((o) => ({ ...o }))
  })
}

export async function restoreDefaultOne(id: string): Promise<void> {
  await mutate((d) => {
    const def = d.defaults.find((o) => o.id === id)
    if (def) {
      d.officials = d.officials.some((o) => o.id === id)
        ? d.officials.map((o) => (o.id === id ? { ...def } : o))
        : [...d.officials, { ...def }]
    } else {
      d.officials = d.officials.filter((o) => o.id !== id)
    }
  })
}
