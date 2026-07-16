'use client';
import { usePathname } from 'next/navigation';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { Navbar } from '@/components/layout/Navbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <VerificationBanner />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
