import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { ToasterClient } from '@/components/ui/ToasterClient'
import './globals.css'
import 'goey-toast/styles.css'

const inter = Inter({ subsets: ['latin'] })

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://openshelf.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'OpenShelf — Free Global E-Library',
    template: '%s | OpenShelf',
  },
  description:
    'OpenShelf is an open-source global e-library. Discover, read, and share free books, papers, audio, and courses — contributed by the community.',
  keywords: ['ebooks', 'free library', 'open source', 'books', 'research papers', 'audiobooks', 'courses'],
  authors: [{ name: 'OpenShelf' }],
  creator: 'OpenShelf',
  openGraph: {
    type: 'website',
    siteName: 'OpenShelf',
    title: 'OpenShelf — Free Global E-Library',
    description: 'Discover and share free books, papers, audio, and courses.',
    url: BASE_URL,
    images: [
      {
        url: '/og-default.png',  // 1200×630 static fallback
        width: 1200,
        height: 630,
        alt: 'OpenShelf — Free Global E-Library',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenShelf — Free Global E-Library',
    description: 'Discover and share free books, papers, audio, and courses.',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <ToasterClient />
        </ThemeProvider>
      </body>
    </html>
  )
}