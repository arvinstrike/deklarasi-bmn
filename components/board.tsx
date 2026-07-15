'use client'

import { useEffect, useRef, useState } from 'react'
import type { BoardState, EventInfo, Official } from '@/lib/types'
import { ESELON_I_COUNT } from '@/lib/types'
import { DEKLARASI } from '@/lib/deklarasi'
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

  // Browsers block autoplay until a user gesture — unlock the audio context on
  // the first click/key on the board tab, then chime on every new confirmation.
  const audioRef = useRef<AudioContext | null>(null)
  const [soundOn, setSoundOn] = useState(false)
  useEffect(() => {
    const unlock = () => {
      const w = window as typeof window & { webkitAudioContext?: typeof AudioContext }
      if (!audioRef.current) audioRef.current = new (w.AudioContext ?? w.webkitAudioContext!)()
      void audioRef.current.resume().then(() => setSoundOn(true))
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    if (!current) return
    chime(audioRef.current)
    const t = setTimeout(() => setCurrent(null), ANNOUNCE_MS)
    return () => clearTimeout(t)
  }, [current])

  // Stage drives the presentation: opening narration slide → signing board.
  // Undefined (old state docs) falls back to the board so nothing breaks.
  const stage = state.event.stage ?? 'board'

  const visible = state.officials.filter((o) => !o.hidden)
  const signed = visible.filter((o) => o.confirmed).length
  // Board shows only officials who have declared — starts empty, fills in live.
  const eselonIds = new Set(visible.slice(0, ESELON_I_COUNT).map((o) => o.id))
  const eselon1 = visible.filter((o) => o.confirmed && eselonIds.has(o.id))
  const rest = visible.filter((o) => o.confirmed && !eselonIds.has(o.id))

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-background">
      <FitToScreen>
        <div
          className="relative flex h-full w-full flex-col overflow-hidden px-[5cqw] pb-[4.5cqh] pt-[5.5cqh]"
          style={{ containerType: 'size', background: 'var(--royal-bg)' }}
        >
          <LogoBar />

          {stage === 'opening' ? (
            <Narration />
          ) : (
            <>
              <Header event={state.event} signed={signed} total={visible.length} />
              <div className="mt-[2cqh] flex min-h-0 flex-1 flex-col gap-[2.5cqh]">
                {eselon1.length > 0 && (
                  <div className="flex shrink-0 justify-center gap-[4cqw]">
                    {eselon1.map((o) => (
                      // ponytail: 9.5cqw ≈ 1.5× the auto-fit cells below — tune here.
                      <div key={o.id} style={{ width: '9.5cqw', containerType: 'inline-size' }}>
                        <PhotoBlock official={o} />
                      </div>
                    ))}
                  </div>
                )}
                {rest.length > 0 && <AutoFitGrid officials={rest} />}
              </div>
              <BoardFooter />
            </>
          )}

          <Frame />
          {stage === 'board' && !soundOn && (
            // Any click/key unlocks audio (window listener); this is just the cue.
            <button className="absolute bottom-[2.5cqh] left-[5cqw] z-20 rounded-full border border-accent/50 bg-background/70 px-[1.4cqw] py-[0.7cqh] font-mono text-[0.7cqw] uppercase tracking-widest text-accent backdrop-blur">
              &#128266; Klik untuk aktifkan suara
            </button>
          )}
          {stage === 'board' && current && <Announcement official={current} />}
        </div>
      </FitToScreen>
    </main>
  )
}

// Static institutional logos — two flanking the top-left, two the top-right.
const LOGOS_LEFT = [
  { src: '/logo/1-setjen.jpeg', alt: 'Setjen DPR RI' },
  { src: '/logo/2-roku.png', alt: 'ROKU' },
]
const LOGOS_RIGHT = [
  { src: '/logo/5-ts.png', alt: 'TS' },
  { src: '/logo/6-zona.png', alt: 'Zona Integritas' },
]

function LogoGroup({ logos }: { logos: { src: string; alt: string }[] }) {
  return (
    <div className="flex items-center gap-[2cqw]">
      {logos.map((l) => (
        // White chip so logos read against the dark royal background.
        <span
          key={l.src}
          className="flex items-center rounded-[0.8cqw] bg-white/95 px-[1cqw] py-[0.7cqh] shadow-[0_0.2cqw_1cqw_rgba(0,0,0,0.35)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.src} alt={l.alt} className="h-[4.4cqh] w-auto object-contain" />
        </span>
      ))}
    </div>
  )
}

function LogoBar() {
  return (
    <div className="mb-[1.4cqh] mt-[1.5cqh] flex items-center justify-between px-[5cqw]">
      <LogoGroup logos={LOGOS_LEFT} />
      <LogoGroup logos={LOGOS_RIGHT} />
    </div>
  )
}

// Celebratory C-major bell arpeggio, synthesized live — no audio asset to ship.
// Swap for `new Audio('/chime.mp3').play()` later if a real gong is preferred.
function chime(ctx: AudioContext | null) {
  if (!ctx || ctx.state !== 'running') return
  const now = ctx.currentTime
  ;[523.25, 659.25, 783.99].forEach((f, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    const t = now + i * 0.12
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.28, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 1.5)
  })
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
        {DEKLARASI.kicker}
      </p>
      <h1 className="mt-[1.2cqh] max-w-[80cqw] text-balance font-serif text-[2.8cqw] font-semibold leading-[1.06] tracking-tight text-foreground">
        {event.title}
      </h1>
      <p className="mt-[0.9cqh] max-w-[58cqw] text-pretty font-serif text-[1.15cqw] italic leading-snug text-muted-foreground">
        {event.subtitle}
      </p>
      <div className="mt-[1.2cqh] flex items-center gap-[2cqw] font-mono text-[0.82cqw] uppercase tracking-[0.22em] text-foreground/80">
        <span>{formatDate(event.date)}</span>
        <Diamond />
        <span>{event.location}</span>
        <Diamond />
        <span>
          {signed} / {total} Menyatakan Komitmen
        </span>
      </div>
    </header>
  )
}

// The declaration statement shown on the projected board — no full narrative,
// just the affirmation that portraits shown have signed the shared commitment.
function BoardFooter() {
  return (
    <footer className="mt-[1.5cqh] shrink-0 text-center">
      <p className="mx-auto max-w-[74cqw] text-pretty font-serif text-[1.05cqw] italic leading-snug text-muted-foreground">
        Para pejabat yang portretnya tampil pada layar ini telah menyatakan{' '}
        <span className="not-italic text-accent">Komitmen Bersama</span> Peningkatan
        Kualitas Pengelolaan Keuangan dan Barang Milik Negara.
      </p>
    </footer>
  )
}

// Opening slide (stage='opening'): the full declaration text the MC briefs on.
function Narration() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[3cqw] text-center [animation:rise_600ms_ease-out]">
      <p className="font-mono text-[0.9cqw] uppercase tracking-[0.45em] text-accent">
        {DEKLARASI.kicker}
      </p>
      <h1 className="mt-[1.4cqh] font-serif text-[3.4cqw] font-semibold uppercase leading-[1.04] tracking-tight text-foreground">
        {DEKLARASI.title}
      </h1>
      <p className="mt-[1cqh] max-w-[70cqw] text-balance font-serif text-[1.55cqw] italic leading-snug text-muted-foreground">
        {DEKLARASI.subtitle}
      </p>

      <div className="my-[2cqh] flex items-center gap-[1.4cqw] text-accent">
        <span className="h-px w-[9cqw] bg-accent/50" />
        <Diamond />
        <span className="h-px w-[9cqw] bg-accent/50" />
      </div>

      <p className="max-w-[76cqw] text-pretty text-justify font-serif text-[1.35cqw] leading-[1.5] text-foreground/90">
        {DEKLARASI.narasi}
      </p>

      <ol className="mt-[2.2cqh] flex max-w-[80cqw] flex-col gap-[1.4cqh] text-left">
        {DEKLARASI.points.map((p, i) => (
          <li key={i} className="flex gap-[1.4cqw]">
            <span className="mt-[0.2cqh] flex h-[2.4cqw] w-[2.4cqw] shrink-0 items-center justify-center rounded-full bg-[var(--gold-sheen)] font-serif text-[1.3cqw] font-bold text-primary-foreground">
              {i + 1}
            </span>
            <p className="text-pretty font-serif text-[1.28cqw] leading-[1.42] text-foreground/90">
              {p}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Diamond() {
  return (
    <span aria-hidden className="text-accent">
      &#9670;
    </span>
  )
}

// frame.svg recolored to brushed gold via CSS mask (its shape drives the mask,
// the gold gradient fills it). Full-bleed over the 1920x1080 canvas.
function Frame() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        background: 'var(--gold-sheen)',
        WebkitMaskImage: 'url(/frame.svg)',
        maskImage: 'url(/frame.svg)',
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    />
  )
}

function Announcement({ official }: { official: Official }) {
  return (
    <div
      key={official.id}
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-[2px] [animation:announceIn_500ms_ease-out]"
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
