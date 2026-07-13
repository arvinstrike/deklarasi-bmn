import { notFound } from 'next/navigation'
import { findByToken } from '@/lib/store'
import { ConfirmClient } from '@/components/confirm-client'

export const dynamic = 'force-dynamic'

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const official = findByToken(token)
  if (!official) notFound()
  return <ConfirmClient official={official} />
}
