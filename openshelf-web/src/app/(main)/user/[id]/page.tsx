import { notFound } from 'next/navigation'
import { serverApi } from '@/lib/server-api'
import { UserProfile } from '@/components/user/UserProfile'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

async function getUser(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const user = await getUser(id)

  if (!user) return { title: 'User Not Found' }

  const title = `${user.name} (@${user.username ?? id}) — OpenShelf`
  const description = user.bio
    ? user.bio.slice(0, 160)
    : `${user.name} is a contributor on OpenShelf with ${user._count?.resources ?? 0} uploads.`

  return {
    title,
    description,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL}/users/${id}` },
    openGraph: {
      title,
      description,
      images: user.avatarUrl ? [{ url: user.avatarUrl }] : ['/og-default.png'],
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
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

  const userWithBadges = {
    ...user,
    badges: user.badges,
  }

  return <UserProfile user={userWithBadges} uploads={uploads} />
}