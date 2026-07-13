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
}))
let event: EventInfo = { ...EVENT }

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
