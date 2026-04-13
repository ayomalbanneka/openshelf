import { notFound } from 'next/navigation'
import { serverApi } from '@/lib/server-api'
import { DiscussionChat } from '@/components/clubs/DiscussionChat'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string; discussionId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug, discussionId } = await params
    const discussion = await serverApi.clubs.getDiscussion(slug, discussionId)
    return {
      title: discussion.title,
      description: discussion.body.slice(0, 120),
    }
  } catch {
    return { title: 'Discussion' }
  }
}

export default async function DiscussionPage({ params }: Props) {
  const { slug, discussionId } = await params

  let discussion
  try {
    discussion = await serverApi.clubs.getDiscussion(slug, discussionId)
  } catch {
    notFound()
  }

  return (
    <DiscussionChat
      clubSlug={slug}
      discussionId={discussionId}
      discussion={discussion}
    />
  )
}