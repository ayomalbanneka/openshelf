import { RequireAuth } from '@/components/auth/RequireAuth';
import { ContributorDashboard } from '@/components/contributor/ContributorDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Dashboard — OpenShelf' };

export default function DashboardPage() {
  return (
    <RequireAuth>
      <ContributorDashboard />
    </RequireAuth>
  );
}
