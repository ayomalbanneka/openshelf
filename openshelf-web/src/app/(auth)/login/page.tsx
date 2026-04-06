import Link from 'next/link'
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          OpenSelf
        </Link>
        <p className="mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Sign in to your account
        </p>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm"
        style={{ color: 'hsl(var(--muted-foreground))' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </>
  )
}