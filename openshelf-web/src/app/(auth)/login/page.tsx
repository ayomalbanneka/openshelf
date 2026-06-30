import Link from 'next/link'
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

export const metadata: Metadata = { title: 'Sign in — OpenShelf' }

export default function LoginPage() {
  return (
    <>
      <div className="mb-8">
        <Link href="/" className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2563eb' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold">Open<span className="text-blue-600">Shelf</span></span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Sign in to your account to continue
        </p>
      </div>

      <LoginForm />

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />
        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />
      </div>

      <OAuthButtons />

      <p className="mt-6 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          Create one free
        </Link>
      </p>
    </>
  )
}