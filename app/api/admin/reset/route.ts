import { NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { resetAll } from '@/lib/store'

// Clear every official's confirmation (for a re-run / after testing).
export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  await resetAll()
  return NextResponse.json({ ok: true })
}
