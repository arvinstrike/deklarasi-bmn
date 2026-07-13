import { NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { addOfficial, adminUpdateOfficial } from '@/lib/store'

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const { op, id, patch } = await req.json().catch(() => ({}))

  if (op === 'add') {
    const name = typeof patch?.name === 'string' ? patch.name.trim() : ''
    const position = typeof patch?.position === 'string' ? patch.position.trim() : ''
    if (!name || !position) {
      return NextResponse.json({ ok: false, error: 'nama & jabatan wajib' }, { status: 400 })
    }
    const phone = typeof patch?.phone === 'string' ? patch.phone.trim() : null
    const official = await addOfficial({ name, position, phone })
    return NextResponse.json({ ok: true, official })
  }

  if (!id) return NextResponse.json({ ok: false }, { status: 400 })

  if (op === 'hide') {
    await adminUpdateOfficial(id, { hidden: true })
  } else if (op === 'show') {
    await adminUpdateOfficial(id, { hidden: false })
  } else if (op === 'unconfirm') {
    await adminUpdateOfficial(id, { confirmed: false, confirmed_at: null })
  } else if (op === 'update') {
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
