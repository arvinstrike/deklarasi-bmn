'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BoardState, EventInfo, Official } from '@/lib/types'

async function post(url: string, body: unknown) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function AdminPanel({
  initial,
  qontakReady,
}: {
  initial: BoardState
  qontakReady: boolean
}) {
  const router = useRouter()
  const [state, setState] = useState<BoardState>(initial)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')

  async function refresh() {
    const res = await fetch('/api/state', { cache: 'no-store' })
    if (res.ok) setState(await res.json())
  }

  async function run(fn: () => Promise<Response>) {
    setBusy(true)
    await fn()
    await refresh()
    setBusy(false)
  }

  async function sendAll() {
    const targets = state.officials.filter((o) => o.phone)
    if (targets.length === 0) return
    if (!confirm(`Kirim undangan WA ke ${targets.length} pejabat?`)) return
    setBusy(true)
    let sent = 0
    for (let i = 0; i < targets.length; i++) {
      setProgress(`Mengirim ${i + 1}/${targets.length}...`)
      const res = await post('/api/admin/invite', { id: targets[i].id })
      const data = await res.json().catch(() => ({ ok: false }))
      if (data.ok) sent++
    }
    setProgress(`Selesai: ${sent}/${targets.length} terkirim.`)
    await refresh()
    setBusy(false)
  }

  const signed = state.officials.filter((o) => o.confirmed).length
  const withPhone = state.officials.filter((o) => o.phone).length

  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-background px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground">
            {signed} / {state.officials.length} menyatakan komitmen
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            className="rounded border border-border px-3 py-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted"
          >
            Papan
          </a>
          <button
            onClick={async () => {
              await post('/api/admin/logout', {})
              router.refresh()
            }}
            className="rounded border border-border px-3 py-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted"
          >
            Keluar
          </button>
        </div>
      </div>

      {!qontakReady && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          WhatsApp (Qontak) belum dikonfigurasi. Isi env{' '}
          <code className="font-mono text-xs">QONTAK_TOKEN / QONTAK_CHANNEL_ID / QONTAK_TEMPLATE_ID</code>{' '}
          agar tombol kirim aktif. Nomor HP tetap bisa diisi sekarang.
        </div>
      )}

      <TestSend />

      <EventForm
        event={state.event}
        busy={busy}
        onSave={(patch) => run(() => post('/api/admin/event', { patch }))}
      />

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Pejabat
          </h2>
          <div className="flex items-center gap-3">
            {progress && <span className="text-xs text-muted-foreground">{progress}</span>}
            <button
              disabled={busy || signed === 0}
              onClick={() => {
                if (confirm('Reset SEMUA konfirmasi? Semua pejabat kembali ke status belum menyatakan.'))
                  run(() => post('/api/admin/reset', {}))
              }}
              className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              Reset semua
            </button>
            <button
              disabled={busy || withPhone === 0}
              onClick={sendAll}
              className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
            >
              Kirim WA ke semua ({withPhone})
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {state.officials.map((o) => (
            <OfficialRow
              key={o.id}
              official={o}
              busy={busy}
              onUpdate={(patch) => run(() => post('/api/admin/official', { op: 'update', id: o.id, patch }))}
              onDelete={() => run(() => post('/api/admin/official', { op: 'delete', id: o.id }))}
              onUnconfirm={() => run(() => post('/api/admin/official', { op: 'unconfirm', id: o.id }))}
              onSend={() => run(() => post('/api/admin/invite', { id: o.id }))}
            />
          ))}
        </div>
      </section>
    </main>
  )
}

function TestSend() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null)

  async function send() {
    setBusy(true)
    setResult(null)
    const res = await post('/api/admin/test-invite', { phone, name })
    const data = await res.json().catch(() => ({ ok: false, error: 'gagal' }))
    setResult(data)
    setBusy(false)
  }

  return (
    <section className="mb-6 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
      <h2 className="mb-1 font-mono text-xs uppercase tracking-widest text-primary">
        Tes Kirim WA
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Kirim ke nomor bebas (pribadi/random) untuk menguji. Tidak menyentuh data pejabat.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Nomor WhatsApp
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0812..."
            className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Nama (opsional)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tes Kirim"
            className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <button
          disabled={busy || !phone}
          onClick={send}
          className="rounded bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {busy ? 'Mengirim...' : 'Kirim Tes'}
        </button>
      </div>
      {result && (
        <p className={`mt-3 text-sm ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
          {result.ok
            ? '✓ Terkirim! Cek WhatsApp nomor tersebut.'
            : `✗ Gagal: ${result.error ?? 'unknown'}`}
        </p>
      )}
    </section>
  )
}

function EventForm({
  event,
  busy,
  onSave,
}: {
  event: EventInfo
  busy: boolean
  onSave: (patch: Partial<EventInfo>) => void
}) {
  const [title, setTitle] = useState(event.title)
  const [subtitle, setSubtitle] = useState(event.subtitle)
  const [location, setLocation] = useState(event.location)
  const [date, setDate] = useState(event.date)

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Acara
      </h2>
      <div className="flex flex-col gap-2">
        <Field label="Judul" value={title} onChange={setTitle} />
        <Field label="Subjudul" value={subtitle} onChange={setSubtitle} />
        <div className="flex gap-2">
          <Field label="Lokasi" value={location} onChange={setLocation} />
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Tanggal
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          disabled={busy}
          onClick={() => onSave({ title, subtitle, location, date })}
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          Simpan Acara
        </button>
        <button
          disabled={busy}
          onClick={() => onSave({ locked: !event.locked })}
          className={`rounded border px-4 py-2 text-sm font-medium disabled:opacity-40 ${
            event.locked
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          {event.locked ? 'Terkunci — Buka' : 'Kunci Acara'}
        </button>
      </div>
    </section>
  )
}

function OfficialRow({
  official,
  busy,
  onUpdate,
  onDelete,
  onUnconfirm,
  onSend,
}: {
  official: Official
  busy: boolean
  onUpdate: (patch: { name: string; position: string; phone: string }) => void
  onDelete: () => void
  onUnconfirm: () => void
  onSend: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(official.name)
  const [position, setPosition] = useState(official.position)
  const [phone, setPhone] = useState(official.phone ?? '')

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded border border-primary/50 bg-card p-3">
        <Field label="Nama" value={name} onChange={setName} />
        <Field label="Jabatan" value={position} onChange={setPosition} />
        <Field label="Nomor WhatsApp (mis. 08123...)" value={phone} onChange={setPhone} />
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => {
              onUpdate({ name, position, phone })
              setEditing(false)
            }}
            className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
          >
            Simpan
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
          >
            Batal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{official.name}</p>
        <p className="truncate text-xs text-muted-foreground">{official.position}</p>
        <p className="mt-0.5 truncate font-mono text-[0.7rem] text-muted-foreground">
          {official.phone || 'belum ada nomor'}
        </p>
      </div>
      {official.confirmed && (
        <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-primary">
          Komitmen
        </span>
      )}
      {official.wa_status === 'sent' && (
        <span className="shrink-0 text-[0.65rem] font-medium uppercase tracking-wider text-green-600">
          Terkirim
        </span>
      )}
      {official.wa_status === 'failed' && (
        <span className="shrink-0 text-[0.65rem] font-medium uppercase tracking-wider text-red-600">
          Gagal
        </span>
      )}
      <div className="flex shrink-0 gap-1">
        <button
          disabled={busy || !official.phone}
          onClick={onSend}
          title={official.phone ? 'Kirim undangan WA' : 'Isi nomor dulu'}
          className="rounded border border-primary/40 px-2.5 py-1 text-xs text-primary hover:bg-primary/5 disabled:opacity-40"
        >
          Kirim
        </button>
        {official.confirmed && (
          <button
            disabled={busy}
            onClick={onUnconfirm}
            className="rounded border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            Batalkan
          </button>
        )}
        <button
          disabled={busy}
          onClick={() => setEditing(true)}
          className="rounded border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          Edit
        </button>
        <button
          disabled={busy}
          onClick={() => {
            if (confirm(`Hapus ${official.name}?`)) onDelete()
          }}
          className="rounded border border-red-300 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          Hapus
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  )
}
