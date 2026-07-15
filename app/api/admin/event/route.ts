import { NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { updateEvent } from '@/lib/store'
import type { EventInfo } from '@/lib/types'

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const { patch } = await req.json().catch(() => ({}))
  const clean: Partial<EventInfo> = {}
  if (typeof patch?.title === 'string') clean.title = patch.title.trim()
  if (typeof patch?.subtitle === 'string') clean.subtitle = patch.subtitle.trim()
  if (typeof patch?.location === 'string') clean.location = patch.location.trim()
  if (typeof patch?.date === 'string') clean.date = patch.date
  if (typeof patch?.locked === 'boolean') clean.locked = patch.locked
  if (patch?.stage === 'opening' || patch?.stage === 'board') clean.stage = patch.stage
  await updateEvent(clean)
  return NextResponse.json({ ok: true })
}
