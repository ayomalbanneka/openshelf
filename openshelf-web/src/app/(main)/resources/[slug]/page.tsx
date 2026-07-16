import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/server-api';
import type { Metadata } from 'next';
import { ResourceDetail } from '@/components/resource/ResourceDetail';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://openshelf.app';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getResource(slug: string) {
  const res = await fetch(`${API_URL}/resources/${slug}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResource(slug);

  if (!resource) {
    return { title: 'Resource Not Found' };
  }

  const title = resource.title;
  const description = resource.description
    ? resource.description.slice(0, 160)
    : `${resource.type} uploaded by ${resource.uploader?.name ?? 'a contributor'} on OpenShelf.`;
  const ogImage = resource.thumbnailUrl ?? '/og-default.png';
  const url = `${BASE_URL}/resources/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      authors: resource.uploader?.name ? [resource.uploader.name] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;

  let resource;
  try {
    resource = await serverApi.resources.getOne(slug);
  } catch {
    notFound();
  }

  return <ResourceDetail resource={resource} />;
}
