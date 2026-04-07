import BrowsePreview from '@/components/landing/BrowserPreview'
import Community from '@/components/landing/Community'
import CTA from '@/components/landing/CTA'
import Features from '@/components/landing/Features'
import Footer from '@/components/landing/Footer'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Navbar from '@/components/landing/Navbar'

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