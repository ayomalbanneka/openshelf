import { notFound } from 'next/navigation'
import { ListDetail } from '@/components/lists/ListDetail'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Reading list' }

export default async function ListDetailPage({ params }: Props) {
  const { id } = await params
  return <ListDetail listId={id} />
}