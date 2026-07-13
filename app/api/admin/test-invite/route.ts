import { NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { sendInvite } from '@/lib/qontak'
import { ROSTER } from '@/lib/roster'

// Send a test WA to an arbitrary number (no real official touched). Returns the
// raw Qontak result so errors (e.g. template not approved) are visible.
export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const { phone, name } = await req.json().catch(() => ({}))
  if (!phone) return NextResponse.json({ ok: false, error: 'no-phone' }, { status: 400 })

  const result = await sendInvite({
    id: 'test',
    order: 0,
    name: (typeof name === 'string' && name.trim()) || 'Tes Kirim',
    position: '',
    photo: '',
    token: ROSTER[0].token, // real token so the button link resolves
    confirmed: false,
    confirmed_at: null,
    phone: String(phone),
  })
  return NextResponse.json(result)
}
