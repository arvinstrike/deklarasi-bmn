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
  /** Soft-delete: hidden officials stay in the DB but drop off the board. */
  hidden?: boolean
}

export interface EventInfo {
  title: string
  subtitle: string
  location: string
  date: string
  locked: boolean
  /** Presentation stage the board follows: opening narration slide → signing board. */
  stage?: 'opening' | 'board'
}

export interface BoardState {
  event: EventInfo
  officials: Official[]
}

/** First N officials are Eselon I — shown larger on the top row. */
export const ESELON_I_COUNT = 4
