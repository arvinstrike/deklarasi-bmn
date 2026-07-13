export interface Official {
  id: string
  order: number
  name: string
  position: string
  photo: string
  /** Unique link token (used by /s/[token]). */
  token: string
  confirmed: boolean
  confirmed_at: number | null
  /** WhatsApp recipient number (admin-entered). */
  phone?: string | null
  /** Last WA invite result. */
  wa_status?: 'sent' | 'failed' | null
}

export interface EventInfo {
  title: string
  subtitle: string
  location: string
  date: string
  locked: boolean
}

export interface BoardState {
  event: EventInfo
  officials: Official[]
}

/** First N officials are Eselon I — shown larger on the top row. */
export const ESELON_I_COUNT = 4
