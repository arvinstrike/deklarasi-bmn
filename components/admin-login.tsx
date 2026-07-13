'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminLogin() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(false)
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    setBusy(false)
    if (res.ok) router.refresh()
    else setErr(true)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5">
      <form
        onSubmit={submit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-card p-6"
      >
        <h1 className="font-serif text-xl font-semibold text-foreground">
          Admin — Deklarasi Komitmen BMN
        </h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password admin"
          autoFocus
          className="rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {err && <p className="text-sm text-red-600">Password salah.</p>}
        <button
          disabled={busy || !pw}
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {busy ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </main>
  )
}
