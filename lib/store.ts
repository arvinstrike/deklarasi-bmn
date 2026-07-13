import { ROSTER, EVENT } from './roster'
import type { BoardState, Official } from './types'

/**
 * ponytail: in-memory store for step 1 — proves the SSR + polling load path.
 * Vercel serverless won't share this across instances, so it's dev/demo only.
 * Step 2 swaps these three functions for Firestore (Admin SDK) — same seam.
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

export function getState(): BoardState {
  return build()
}

export function findByToken(token: string): Official | null {
  return build().officials.find((o) => o.token === token) ?? null
}

export function confirmByToken(token: string): Official | null {
  const r = ROSTER.find((x) => x.token === token)
  if (!r) return null
  if (!confirmedAt.has(token)) confirmedAt.set(token, Date.now())
  return build().officials.find((o) => o.token === token) ?? null
}

export function unconfirmByToken(token: string): boolean {
  return confirmedAt.delete(token)
}
