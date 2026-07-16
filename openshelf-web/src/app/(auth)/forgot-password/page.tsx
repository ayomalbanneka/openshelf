'use client';
import { useState } from 'react';
import Link from 'next/link';
import { http } from '@/lib/api';
import { Inbox } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Enter your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await http.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  };

  if (submitted) {
    return (
      <div className="text-center">
        <Inbox className="w-10 h-10 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Check your inbox</h1>
        <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
          If <strong>{email}</strong> has an account, a reset code has been sent.
        </p>
        <Link
          href="/reset-password"
          className="w-full h-10 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          Enter reset code →
        </Link>
        <Link
          href="/login"
          className="block mt-3 text-sm text-center hover:underline"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-1">Forgot password</h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Enter your email and we&apos;ll send you a reset code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-10 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={inputStyle}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send reset code'}
        </button>
      </form>

      <Link
        href="/login"
        className="block mt-6 text-sm text-center hover:underline"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        ← Back to login
      </Link>
    </>
  );
}
