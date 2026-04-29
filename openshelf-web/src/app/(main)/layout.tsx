import { VerificationBanner } from '@/components/auth/VerificationBanner'
import { Navbar } from '@/components/layout/Navbar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <VerificationBanner />
      <main className="flex-1">{children}</main>
    </div>
  )
}