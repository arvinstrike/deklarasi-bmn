import { NextResponse } from 'next/server'
import { confirmByToken } from '@/lib/store'

export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({ token: '' }))
  const official = await confirmByToken(token)
  if (!official) return NextResponse.json({ ok: false }, { status: 404 })
  return NextResponse.json({ ok: true, official })
}
