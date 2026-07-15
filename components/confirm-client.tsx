'use client'

import { useState } from 'react'
import type { Official } from '@/lib/types'
import { DEKLARASI } from '@/lib/deklarasi'

// Phone flow: the official reads the commitment, taps once to declare it, then
// their portrait reveals on the board (via polling). Idempotent — safe twice.
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
    <main
      className="flex min-h-dvh w-full flex-col items-center px-5 py-10 text-center"
      style={{ background: 'var(--royal-bg)' }}
    >
      <div className="flex w-full max-w-md flex-col items-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.35em] text-accent">
          {DEKLARASI.kicker}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold uppercase leading-tight text-foreground">
          {DEKLARASI.title}
        </h1>
        <p className="mt-2 font-serif text-base italic leading-snug text-muted-foreground">
          {DEKLARASI.subtitle}
        </p>

        {done ? (
          <Recorded official={official} />
        ) : (
          <>
            <div className="mt-8 w-full rounded-xl border border-border bg-card/60 p-5 text-left [animation:rise_500ms_ease-out]">
              <p className="text-pretty font-serif text-[0.95rem] leading-relaxed text-foreground/90">
                {DEKLARASI.narasi}
              </p>
              <ol className="mt-4 flex flex-col gap-3">
                {DEKLARASI.points.map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold-sheen)] font-serif text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <p className="text-pretty font-serif text-[0.9rem] leading-snug text-foreground/85">
                      {p}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <Portrait official={official} dim />
            <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
              Dengan menekan tombol di bawah, Anda menyatakan komitmen atas
              deklarasi di atas. Foto resmi Anda akan langsung tampil pada layar.
            </p>
            <button
              onClick={confirm}
              disabled={busy}
              className="mt-6 h-16 w-full rounded-md bg-[var(--gold-sheen)] text-lg font-semibold text-primary-foreground shadow-[0_0_1.4rem_rgba(232,204,118,0.35)] transition-opacity disabled:opacity-40"
            >
              {busy ? 'Menyimpan...' : 'Saya Menyatakan Komitmen'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}

function Recorded({ official }: { official: Official }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative mt-8">
        <Portrait official={official} />
        <span className="absolute -bottom-2 -right-2 rounded-full border-2 border-primary-foreground bg-[var(--gold-sheen)] px-3 py-1 font-serif text-xs font-bold uppercase tracking-wide text-primary-foreground [animation:sealIn_650ms_ease-out] shadow-lg">
          ✓ Berkomitmen
        </span>
      </div>
      <h2 className="mt-6 font-serif text-2xl font-semibold text-foreground">
        {official.name}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{official.position}</p>
      <p className="mt-6 font-serif text-xl text-accent">Komitmen Terekam</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Terima kasih. Foto Anda kini tampil pada layar Deklarasi Komitmen Bersama.
      </p>
    </div>
  )
}

function Portrait({ official, dim = false }: { official: Official; dim?: boolean }) {
  if (!official.photo) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={encodeURI(official.photo)}
      alt={official.name}
      className={`h-36 w-36 rounded-full object-cover object-top ring-2 ring-gold ${
        dim ? 'mt-8 opacity-40 grayscale' : 'shadow-[0_0_1.6rem_var(--gold)]'
      }`}
    />
  )
}
