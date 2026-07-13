import { ROSTER, EVENT } from './roster'
import type { BoardState, EventInfo, Official } from './types'

/**
 * In-memory fallback store — used when FIREBASE_SERVICE_ACCOUNT is not set, so
 * local dev works without credentials. Not shared across serverless instances;
 * production uses store-firestore. Async to match the Firestore interface.
 */
let officials: Official[] = ROSTER.map((r, i) => ({
  id: `o${i + 1}`,
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
}))
let event: EventInfo = { ...EVENT }

const pristine = (o: Official): Official => ({
  ...o,
  confirmed: false,
  confirmed_at: null,
  hidden: false,
  wa_status: null,
})
let defaults: Official[] = officials.map(pristine)

export async function getState(): Promise<BoardState> {
  return { event, officials: [...officials].sort((a, b) => a.order - b.order) }
}

export async function findByToken(token: string): Promise<Official | null> {
  return officials.find((o) => o.token === token) ?? null
}

export async function confirmByToken(token: string): Promise<Official | null> {
  const o = officials.find((x) => x.token === token)
  if (!o) return null
  if (!o.confirmed) {
    o.confirmed = true
    o.confirmed_at = Date.now()
  }
  return o
}

export async function adminUpdateOfficial(
  id: string,
  patch: Partial<Official>,
): Promise<void> {
  officials = officials.map((o) => (o.id === id ? { ...o, ...patch } : o))
}

export async function adminDeleteOfficial(id: string): Promise<void> {
  officials = officials.filter((o) => o.id !== id)
}

export async function updateEvent(patch: Partial<EventInfo>): Promise<void> {
  event = { ...event, ...patch }
}

export async function resetAll(): Promise<void> {
  officials = officials.map((o) => ({ ...o, confirmed: false, confirmed_at: null }))
}

export async function addOfficial(data: {
  name: string
  position: string
  phone?: string | null
}): Promise<Official> {
  const maxOrder = officials.reduce((m, o) => Math.max(m, o.order), 0)
  const o: Official = {
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
  officials = [...officials, o]
  return o
}

export async function saveDefaults(): Promise<void> {
  defaults = officials.map(pristine)
}

export async function restoreDefaultsAll(): Promise<void> {
  if (defaults.length) officials = defaults.map((o) => ({ ...o }))
}

export async function restoreDefaultOne(id: string): Promise<void> {
  const def = defaults.find((o) => o.id === id)
  if (def) {
    officials = officials.some((o) => o.id === id)
      ? officials.map((o) => (o.id === id ? { ...def } : o))
      : [...officials, { ...def }]
  } else {
    officials = officials.filter((o) => o.id !== id)
  }
}
