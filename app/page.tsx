import { getState } from '@/lib/store'
import { Board } from '@/components/board'

// SSR the initial state so the board paints instantly — no client DB handshake.
export const dynamic = 'force-dynamic'

export default async function Page() {
  return <Board initial={await getState()} />
}
