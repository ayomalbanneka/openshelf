'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { http } from '@/lib/api';
import { CheckCircle } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { checkPwned } from '@/lib/hibp';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'code' | 'password'>('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pwned, setPwned] = useState<boolean | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  };

  const handleCodeChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Enter your email');
      return;
    }
    if (code.join('').length < 6) {
      setError('Enter all 6 digits');
      return;
    }
    setError('');
    setStep('password');
  };

  useEffect(() => {
    if (password.length < 8) {
      setPwned(undefined);
      return;
    }
    clearTimeout(debounceRef.current);
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      const result = await checkPwned(password);
      setPwned(result);
      setChecking(false);
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [password]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (pwned) {
      setError('This password has appeared in data breaches. Please choose a different one.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await http.post('/auth/reset-password', {
        email,
        code: code.join(''),
        newPassword: password,
      });
      setSuccess(true);
      setTimeout(() => router.replace('/login'), 2500);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid or expired code'));
      setStep('code');
      setCode(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle className="w-10 h-10 mb-4 text-green-600" />
        <h1 className="text-2xl font-bold mb-2 text-green-600">Password reset!</h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Redirecting you to login…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-1">Reset password</h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {step === 'code'
            ? 'Enter your email and the code we sent you.'
            : 'Choose a new password.'}
        </p>
      </div>

      {step === 'code' ? (
        <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">6-digit code</label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-bold rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    border: `2px solid ${digit ? '#2563eb' : 'hsl(var(--border))'}`,
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="h-10 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Continue →
          </button>

          <Link
            href="/forgot-password"
            className="text-sm text-center hover:underline"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Request a new code
          </Link>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="h-10 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            />
            <PasswordStrength password={password} pwned={pwned} checking={checking} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
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
            {loading ? 'Resetting…' : 'Reset password'}
          </button>

          <button
            type="button"
            onClick={() => setStep('code')}
            className="text-sm text-center hover:underline"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            ← Back
          </button>
        </form>
      )}
    </>
  );
}
