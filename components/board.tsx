'use client'

import { useEffect, useRef, useState } from 'react'
import type { BoardState, EventInfo, Official } from '@/lib/types'
import { ESELON_I_COUNT } from '@/lib/types'
import { FitToScreen } from './fit-to-screen'
import { PhotoBlock } from './photo-block'
import { AutoFitGrid } from './auto-fit-grid'

const POLL_MS = 2000
const ANNOUNCE_MS = 5000

export function Board({ initial }: { initial: BoardState }) {
  const [state, setState] = useState<BoardState>(initial)

  // Poll the server for fresh state. Plain HTTP GET — firewall-proof, and the
  // page already painted from SSR so there is never a blank wait.
  useEffect(() => {
    let active = true
    const tick = async () => {
      try {
        const res = await fetch('/api/state', { cache: 'no-store' })
        if (active && res.ok) setState(await res.json())
      } catch {
        /* keep last state; try again next tick */
      }
    }
    const id = setInterval(tick, POLL_MS)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  // Announcement queue: every fresh confirmation gets a sequential ~5s moment,
  // ordered by server timestamp. Never overlaps, never drops one.
  const known = useRef<Set<string> | null>(null)
  const [queue, setQueue] = useState<Official[]>([])
  const [current, setCurrent] = useState<Official | null>(null)

  useEffect(() => {
    const confirmed = state.officials.filter((o) => o.confirmed && !o.hidden)
    const ids = new Set(confirmed.map((o) => o.id))
    if (known.current === null) {
      known.current = ids
      return
    }
    const fresh = confirmed
      .filter((o) => !known.current!.has(o.id))
      .sort((a, b) => (a.confirmed_at ?? 0) - (b.confirmed_at ?? 0))
    known.current = ids
    if (fresh.length) setQueue((q) => [...q, ...fresh])
  }, [state])

  useEffect(() => {
    if (current || queue.length === 0) return
    setCurrent(queue[0])
    setQueue((q) => q.slice(1))
  }, [current, queue])

  useEffect(() => {
    if (!current) return
    const t = setTimeout(() => setCurrent(null), ANNOUNCE_MS)
    return () => clearTimeout(t)
  }, [current])

  const visible = state.officials.filter((o) => !o.hidden)
  const eselon1 = visible.slice(0, ESELON_I_COUNT)
  const rest = visible.slice(ESELON_I_COUNT)
  const signed = visible.filter((o) => o.confirmed).length

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-background">
      <FitToScreen>
        <div
          className="relative flex h-full w-full flex-col overflow-hidden bg-card px-[3.2cqw] pb-[4cqh] pt-[3.5cqh]"
          style={{ containerType: 'size' }}
        >
          <LogoBar />
          <Header event={state.event} signed={signed} total={visible.length} />

          <div className="mt-[2cqh] flex min-h-0 flex-1 flex-col gap-[2.5cqh]">
            <div className="flex shrink-0 justify-center gap-[4cqw]">
              {eselon1.map((o) => (
                // ponytail: 9.5cqw ≈ 1.5× the auto-fit cells below — tune here.
                <div key={o.id} style={{ width: '9.5cqw', containerType: 'inline-size' }}>
                  <PhotoBlock official={o} />
                </div>
              ))}
            </div>
            {rest.length > 0 && <AutoFitGrid officials={rest} />}
          </div>

          <Frame />
          {current && <Announcement official={current} />}
        </div>
      </FitToScreen>
    </main>
  )
}

// Static institutional logos, one row, left→right in protocol order.
const LOGOS = [
  { src: '/logo/1-setjen.jpeg', alt: 'Setjen DPR RI' },
  { src: '/logo/2-roku.png', alt: 'ROKU' },
  { src: '/logo/3-bmn.png', alt: 'BMN' },
  { src: '/logo/4-adm-keu.png', alt: 'Administrasi Keuangan' },
  { src: '/logo/5-ts.png', alt: 'TS' },
  { src: '/logo/6-zona.png', alt: 'Zona Integritas' },
]

function LogoBar() {
  return (
    <div className="mb-[1.6cqh] flex items-center justify-center gap-[2.8cqw]">
      {LOGOS.map((l) => (
        // ponytail: h-[4.5cqh] ≈ 49px on 1080 — tune here if too big/small.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={l.src} src={l.src} alt={l.alt} className="h-[4.5cqh] w-auto object-contain" />
      ))}
    </div>
  )
}

function Header({
  event,
  signed,
  total,
}: {
  event: EventInfo
  signed: number
  total: number
}) {
  return (
    <header className="flex flex-col items-center text-center">
      <p className="font-mono text-[0.78cqw] uppercase tracking-[0.42em] text-accent">
        Republik Indonesia
      </p>
      <h1 className="mt-[1.4cqh] max-w-[80cqw] text-balance font-serif text-[2.9cqw] font-semibold leading-[1.08] tracking-tight text-foreground">
        {event.title}
      </h1>
      <p className="mt-[1cqh] max-w-[58cqw] text-pretty font-serif text-[1.18cqw] italic leading-snug text-muted-foreground">
        {event.subtitle}
      </p>
      <div className="mt-[1.4cqh] flex items-center gap-[2cqw] font-mono text-[0.82cqw] uppercase tracking-[0.22em] text-foreground/80">
        <span>{formatDate(event.date)}</span>
        <span aria-hidden className="text-accent">
          &#9670;
        </span>
        <span>{event.location}</span>
        <span aria-hidden className="text-accent">
          &#9670;
        </span>
        <span>
          {signed} / {total} Menyatakan Komitmen
        </span>
      </div>
    </header>
  )
}

// Formal double-line frame + corner diamonds — pure CSS, tracks the theme.
function Frame() {
  return (
    <div className="pointer-events-none absolute inset-[1.4cqw] z-10 border-[0.28cqw] border-primary after:absolute after:inset-[0.7cqw] after:border-[0.1cqw] after:border-primary after:content-['']">
      {[
        'left-0 top-0 -translate-x-1/2 -translate-y-1/2',
        'right-0 top-0 translate-x-1/2 -translate-y-1/2',
        'left-0 bottom-0 -translate-x-1/2 translate-y-1/2',
        'right-0 bottom-0 translate-x-1/2 translate-y-1/2',
      ].map((pos) => (
        <span
          key={pos}
          className={`absolute h-[0.9cqw] w-[0.9cqw] rotate-45 bg-primary ${pos}`}
        />
      ))}
    </div>
  )
}

function Announcement({ official }: { official: Official }) {
  return (
    <div
      key={official.id}
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-card/70 backdrop-blur-[2px] [animation:announceIn_500ms_ease-out]"
    >
      <div className="flex flex-col items-center px-[6cqw] text-center">
        {official.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={encodeURI(official.photo)}
            alt=""
            className="mb-[2cqh] h-[26cqh] w-[26cqh] rounded-full object-cover object-top ring-[0.3cqw] ring-gold shadow-[0_0_2.4cqw_var(--gold)]"
          />
        )}
        <p className="font-mono text-[0.9cqw] uppercase tracking-[0.42em] text-accent">
          Telah Menyatakan Komitmen
        </p>
        <h2 className="mt-[1.6cqh] text-balance font-serif text-[3.4cqw] font-semibold leading-[1.05] text-foreground drop-shadow-[0_0_1.2cqw_var(--gold)]">
          {official.name}
        </h2>
        <div className="my-[1.4cqh] h-px w-[16cqw] bg-accent/60" />
        <p className="max-w-[56cqw] text-pretty font-serif text-[1.3cqw] italic leading-snug text-muted-foreground">
          {official.position}
        </p>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso + 'T00:00:00'))
  } catch {
    return iso
  }
}
