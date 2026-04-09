import { notFound } from 'next/navigation'
import { serverApi } from '@/lib/server-api'
import type { Metadata } from 'next'
import { ResourceDetail } from '@/components/resource/ResourceDetail'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const resource = await serverApi.resources.getOne(slug)
    return {
      title: resource.title,
      description: resource.description ?? `Read ${resource.title} on OpenShelf`,
      openGraph: {
        title: resource.title,
        description: resource.description ?? '',
        images: resource.thumbnailUrl ? [resource.thumbnailUrl] : [],
      },
    }
  } catch {
    return { title: 'Resource not found' }
  }
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params

  let resource
  try {
    resource = await serverApi.resources.getOne(slug)
  } catch {
    notFound()
  }

  return <ResourceDetail resource={resource} />
}