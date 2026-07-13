import { NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { adminDeleteOfficial, adminUpdateOfficial } from '@/lib/store'

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const { op, id, patch } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ ok: false }, { status: 400 })

  if (op === 'delete') {
    await adminDeleteOfficial(id)
  } else if (op === 'unconfirm') {
    await adminUpdateOfficial(id, { confirmed: false, confirmed_at: null })
  } else if (op === 'update') {
    // Whitelist editable fields.
    const clean: { name?: string; position?: string; phone?: string } = {}
    if (typeof patch?.name === 'string') clean.name = patch.name.trim()
    if (typeof patch?.position === 'string') clean.position = patch.position.trim()
    if (typeof patch?.phone === 'string') clean.phone = patch.phone.trim()
    await adminUpdateOfficial(id, clean)
  } else {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
