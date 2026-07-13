import { cookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'crypto'

export const ADMIN_COOKIE = 'admin_session'

// Cookie value = sha256(password). An attacker can't forge it without knowing
// ADMIN_PASSWORD (server-only). If no password is set, admin is locked (safe).
function expected(): string | null {
  const pw = process.env.ADMIN_PASSWORD
  return pw ? createHash('sha256').update(pw).digest('hex') : null
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function checkPassword(pw: string): boolean {
  const real = process.env.ADMIN_PASSWORD
  return Boolean(real) && safeEqual(pw, real!)
}

export function sessionValue(): string | null {
  return expected()
}

export async function isAuthed(): Promise<boolean> {
  const exp = expected()
  if (!exp) return false
  const val = (await cookies()).get(ADMIN_COOKIE)?.value
  return Boolean(val) && safeEqual(val!, exp)
}
