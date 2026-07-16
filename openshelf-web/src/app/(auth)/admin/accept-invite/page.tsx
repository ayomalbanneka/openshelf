'use client'
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { http } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Shield } from 'lucide-react';

function AcceptInviteForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  const [name, setName]         = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!token) setError('Invalid invite link. Please ask an admin to send a new one.')
  }, [token]);

  const validate = () => {
    if (!name.trim())         return 'Name is required'
    if (password.length < 8)  return 'Password must be at least 8 characters'
    if (password !== confirm)  return 'Passwords do not match'
    return null
  }

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    setError('');
    try {
      await http.post('/auth/accept-invite', { token, name: name.trim(), password })
      setSuccess(true)
      setTimeout(() => router.push('/admin/login'), 3000)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to accept invite. The link may have expired.'))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    border: '1px solid var(--admin-border)',
    backgroundColor: 'var(--admin-surface)',
    color: 'var(--admin-text)',
  }

  // ── Token missing ─────────────────────────────────────────
  if (!token) {
    return (
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: '#fee2e2' }}>
          <Shield className="w-6 h-6" style={{ color: '#991b1b' }} />
        </div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>
          Invalid invite link
        </h2>
        <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
          This link is missing a token. Please ask an admin to send you a new invite.
        </p>
        <a href="/admin/login"
          className="text-sm font-medium mt-2"
          style={{ color: '#1e40af' }}>
          Back to admin login
        </a>
      </div>
    )
  }

  // ── Success state ─────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: '#dcfce7' }}>
          <Shield className="w-6 h-6" style={{ color: '#166534' }} />
        </div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>
          Account created!
        </h2>
        <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
          Redirecting you to the admin login…
        </p>
        <a href="/admin/login"
          className="text-sm font-medium"
          style={{ color: '#1e40af' }}>
          Click here if not redirected
        </a>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: '#eff6ff' }}>
          <Shield className="w-6 h-6" style={{ color: '#1e40af' }} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--admin-text)' }}>
            Accept your invite
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
            Set up your OpenShelf staff account
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
          {error}
        </div>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--admin-muted)' }}>
          Full name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="h-10 rounded-xl px-3 text-sm outline-none w-full"
          style={inputStyle}
          autoFocus
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--admin-muted)' }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="h-10 rounded-xl px-3 text-sm outline-none w-full"
          style={inputStyle}
        />
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5 mb-2">
        <label className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--admin-muted)' }}>
          Confirm password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="Repeat your password"
          className="h-10 rounded-xl px-3 text-sm outline-none w-full"
          style={inputStyle}
        />
      </div>

      {/* Password strength hint */}
      {password.length > 0 && (
        <div className="rounded-lg px-3 py-2 text-xs mb-5"
          style={{
            backgroundColor: password.length >= 8 ? '#dcfce7' : '#fef3c7',
            color:           password.length >= 8 ? '#166534' : '#92400e',
          }}>
          {password.length >= 8
            ? '✓ Password length is good'
            : `${8 - password.length} more character${8 - password.length !== 1 ? 's' : ''} needed`}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !name.trim() || !password || !confirm}
        className="w-full h-10 rounded-xl text-sm font-semibold mt-2 disabled:opacity-50 transition-colors"
        style={{ backgroundColor: '#1e40af', color: '#ffffff' }}>
        {loading ? 'Creating account…' : 'Create my account'}
      </button>

      <p className="text-xs text-center mt-4" style={{ color: 'var(--admin-muted)' }}>
        Already have an account?{' '}
        <a href="/admin/login" style={{ color: '#1e40af', fontWeight: 500 }}>
          Sign in
        </a>
      </p>
    </>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'hsl(var(--muted))' }}>
      <div className="w-full max-w-md rounded-2xl p-8"
        style={{
          backgroundColor: 'hsl(var(--background))',
          border:          '1px solid hsl(var(--border))',
          boxShadow:       '0 4px 24px rgba(0,0,0,0.06)',
        }}>
        <Suspense fallback={
          <div className="text-center text-sm" style={{ color: 'var(--admin-muted)' }}>
            Loading…
          </div>
        }>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  )
}