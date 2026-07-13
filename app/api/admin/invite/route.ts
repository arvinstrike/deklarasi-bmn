import { NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { getState, adminUpdateOfficial } from '@/lib/store'
import { sendInvite } from '@/lib/qontak'

// Sends the WA invite to one official. "Kirim ke semua" is orchestrated by the
// admin client calling this per official, so each request stays fast and no
// single serverless invocation risks a timeout.
export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ ok: false }, { status: 400 })

  const official = (await getState()).officials.find((o) => o.id === id)
  if (!official) return NextResponse.json({ ok: false }, { status: 404 })

  const result = await sendInvite(official)
  await adminUpdateOfficial(id, { wa_status: result.ok ? 'sent' : 'failed' })
  return NextResponse.json({ ok: result.ok, error: result.error })
}
