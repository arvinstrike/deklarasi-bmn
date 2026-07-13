import type { Official } from './types'

const ENDPOINT =
  'https://service-chat.qontak.com/api/open/v1/broadcasts/whatsapp/direct'

export const isQontakConfigured = Boolean(
  process.env.QONTAK_TOKEN &&
    process.env.QONTAK_CHANNEL_ID &&
    process.env.QONTAK_TEMPLATE_ID,
)

// Normalize to Indonesian E.164 without '+': 08.. -> 628.., 8.. -> 628..
export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('62')) return d
  if (d.startsWith('0')) return '62' + d.slice(1)
  if (d.startsWith('8')) return '62' + d
  return d
}

export async function sendInvite(
  official: Official,
): Promise<{ ok: boolean; error?: string }> {
  if (!isQontakConfigured) return { ok: false, error: 'qontak-not-configured' }
  if (!official.phone) return { ok: false, error: 'no-phone' }
  const to = normalizePhone(official.phone)
  if (!to) return { ok: false, error: 'bad-phone' }

  // Template body {{1}} = name; URL button suffix = token (→ /s/<token>).
  const body = {
    to_number: to,
    to_name: official.name,
    message_template_id: process.env.QONTAK_TEMPLATE_ID,
    channel_integration_id: process.env.QONTAK_CHANNEL_ID,
    language: { code: 'id' },
    parameters: {
      body: [{ key: '1', value: 'nama', value_text: official.name }],
      buttons: [{ index: '0', type: 'url', value: official.token }],
    },
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.QONTAK_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `qontak-${res.status}: ${text.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
