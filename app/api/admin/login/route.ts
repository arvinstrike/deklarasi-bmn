import { NextResponse } from 'next/server'
import { checkPassword, sessionValue, ADMIN_COOKIE } from '@/lib/auth'

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }))
  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, sessionValue()!, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12h
  })
  return res
}
