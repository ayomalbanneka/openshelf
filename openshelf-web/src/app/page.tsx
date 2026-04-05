import BrowsePreview from '@/components/ui/landing/BrowserPreview'
import Community from '@/components/ui/landing/Community'
import CTA from '@/components/ui/landing/CTA'
import Features from '@/components/ui/landing/Features'
import Footer from '@/components/ui/landing/Footer'
import Hero from '@/components/ui/landing/Hero'
import HowItWorks from '@/components/ui/landing/HowItWorks'
import Navbar from '@/components/ui/landing/Navbar'

export default function HomePage() {
  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Features />
      <BrowsePreview />
      <HowItWorks />
      <Community />
      <CTA />
      <Footer />
    </div>
  )
}