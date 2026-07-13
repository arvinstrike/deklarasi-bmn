import { ROSTER, EVENT } from './roster'
import type { BoardState, Official } from './types'

/**
 * In-memory fallback store — used when FIREBASE_SERVICE_ACCOUNT is not set, so
 * local dev works without credentials. Not shared across serverless instances;
 * production uses store-firestore. Async to match the Firestore interface.
 */
const confirmedAt = new Map<string, number>() // token -> timestamp

function build(): BoardState {
  const officials: Official[] = ROSTER.map((r, i) => ({
    id: `o${i + 1}`,
    order: i + 1,
    name: r.name,
    position: r.position,
    photo: r.photo,
    token: r.token,
    confirmed: confirmedAt.has(r.token),
    confirmed_at: confirmedAt.get(r.token) ?? null,
  }))
  return { event: EVENT, officials }
}

export async function getState(): Promise<BoardState> {
  return build()
}

export async function findByToken(token: string): Promise<Official | null> {
  return build().officials.find((o) => o.token === token) ?? null
}

export async function confirmByToken(token: string): Promise<Official | null> {
  const r = ROSTER.find((x) => x.token === token)
  if (!r) return null
  if (!confirmedAt.has(token)) confirmedAt.set(token, Date.now())
  return build().officials.find((o) => o.token === token) ?? null
}

export async function unconfirmByToken(token: string): Promise<boolean> {
  return confirmedAt.delete(token)
}
