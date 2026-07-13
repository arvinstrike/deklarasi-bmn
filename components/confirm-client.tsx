'use client'

import { useState } from 'react'
import type { Official } from '@/lib/types'

// Phone flow: one tap to declare commitment. The portrait then reveals on the
// board (via polling). Idempotent — confirming twice is safe.
export function ConfirmClient({ official }: { official: Official }) {
  const [done, setDone] = useState(official.confirmed)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    const res = await fetch('/api/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: official.token }),
    })
    setBusy(false)
    if (res.ok) setDone(true)
  }

  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-5 py-8 text-center">
      <div className="flex w-full max-w-md flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={encodeURI(official.photo)}
          alt={official.name}
          className={`h-36 w-36 rounded-full object-cover object-top ring-2 ring-accent ${
            done ? '' : 'opacity-40 grayscale'
          }`}
        />
        <h1 className="mt-6 font-serif text-2xl font-semibold text-foreground">
          {official.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{official.position}</p>

        {done ? (
          <>
            <p className="mt-8 font-serif text-xl text-foreground">Komitmen Terekam</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Terima kasih. Foto Anda kini tampil pada layar Deklarasi Komitmen Bersama.
            </p>
          </>
        ) : (
          <>
            <p className="mt-8 text-pretty text-sm leading-relaxed text-muted-foreground">
              Tekan tombol di bawah untuk menyatakan komitmen Anda. Foto resmi
              Anda akan langsung tampil pada layar.
            </p>
            <button
              onClick={confirm}
              disabled={busy}
              className="mt-8 h-16 w-full rounded-md bg-primary text-lg font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
            >
              {busy ? 'Menyimpan...' : 'Saya Menyatakan Komitmen'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
