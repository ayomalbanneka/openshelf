import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/server-api';
import { ClubDetail } from '@/components/clubs/ClubDetails';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const club = await serverApi.clubs.getOne(slug);
    return {
      title: club.name,
      description: club.description ?? `Join ${club.name} on OpenShelf`,
    };
  } catch {
    return { title: 'Club not found' };
  }
}

export default async function ClubPage({ params }: Props) {
  const { slug } = await params;

  let club;
  try {
    club = await serverApi.clubs.getOne(slug);
  } catch {
    notFound();
  }

  return <ClubDetail club={club} />;
}
