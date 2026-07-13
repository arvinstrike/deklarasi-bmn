import { NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { restoreDefaultsAll, restoreDefaultOne, saveDefaults } from '@/lib/store'

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const { op, id } = await req.json().catch(() => ({}))

  if (op === 'restore-all') {
    await restoreDefaultsAll()
  } else if (op === 'restore-one') {
    if (!id) return NextResponse.json({ ok: false }, { status: 400 })
    await restoreDefaultOne(id)
  } else if (op === 'save-default') {
    await saveDefaults()
  } else {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
