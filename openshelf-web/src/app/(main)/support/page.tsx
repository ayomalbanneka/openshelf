import { SupportPage } from '@/components/support/SupportPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support OpenShelf',
  description: 'Help keep OpenShelf free and open for everyone.',
};

export default function SupportPageRoute() {
  return <SupportPage />;
}
