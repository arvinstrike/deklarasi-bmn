import { isAuthed } from '@/lib/auth'
import { getState } from '@/lib/store'
import { AdminLogin } from '@/components/admin-login'
import { AdminPanel } from '@/components/admin-panel'

export const dynamic = 'force-dynamic'

export default async function Page() {
  if (!(await isAuthed())) return <AdminLogin />
  return <AdminPanel initial={await getState()} />
}
