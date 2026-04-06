import Link from 'next/link'
import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = { title: 'Create account' }

export default function RegisterPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          OpenSelf
        </Link>
        <p className="mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Create your free account
        </p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-center text-sm"
        style={{ color: 'hsl(var(--muted-foreground))' }}>
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </>
  )
}