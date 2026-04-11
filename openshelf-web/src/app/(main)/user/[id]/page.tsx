import { notFound } from 'next/navigation'
import { serverApi } from '@/lib/server-api'
import { UserProfile } from '@/components/user/UserProfile'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params
    const user = await serverApi.users.getProfile(id)
    return { title: user.name }
  } catch {
    return { title: 'User not found' }
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params

  let user
  let uploads
  try {
    [user, uploads] = await Promise.all([
      serverApi.users.getProfile(id),
      serverApi.users.getUploads(id),
    ])
  } catch (e) {
    console.error(`Failed to fetch data for user`, e)
    notFound()
  }

  return <UserProfile user={user} uploads={uploads} />
}