'use client'
import { useMemo } from 'react'
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'

interface PasswordStrengthProps {
  password: string
  pwned?:   boolean   // true if found in breach database
  checking?: boolean  // true while HIBP check is in flight
}

interface StrengthResult {
  score:    0 | 1 | 2 | 3 | 4
  label:    string
  color:    string
  bg:       string
  checks:   { label: string; passed: boolean }[]
}

const analysePassword = (password: string): StrengthResult => {
  const checks = [
    { label: 'At least 8 characters',              passed: password.length >= 8 },
    { label: 'At least 12 characters',             passed: password.length >= 12 },
    { label: 'Uppercase letter (A–Z)',             passed: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a–z)',             passed: /[a-z]/.test(password) },
    { label: 'Number (0–9)',                       passed: /\d/.test(password) },
    { label: 'Special character (!@#$…)',          passed: /[^A-Za-z0-9]/.test(password) },
  ]

  const score = Math.min(4, checks.filter((c) => c.passed).length) as 0 | 1 | 2 | 3 | 4

  const levels: StrengthResult[] = [
    { score: 0, label: '',          color: '#e5e7eb', bg: '#f9fafb', checks },
    { score: 1, label: 'Weak',      color: '#dc2626', bg: '#fef2f2', checks },
    { score: 2, label: 'Fair',      color: '#d97706', bg: '#fffbeb', checks },
    { score: 3, label: 'Good',      color: '#2563eb', bg: '#eff6ff', checks },
    { score: 4, label: 'Strong',    color: '#16a34a', bg: '#f0fdf4', checks },
  ]

  return { ...levels[score], score }
}

export function PasswordStrength({ password, pwned, checking }: PasswordStrengthProps) {
  const result = useMemo(() => analysePassword(password), [password])

  if (!password) return null

  const barFill = (result.score / 4) * 100

  const Icon = result.score <= 1 ? ShieldX
    : result.score === 2 ? ShieldAlert
    : result.score === 3 ? Shield
    : ShieldCheck

  return (
    <div className="flex flex-col gap-2 mt-1">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: '#e5e7eb' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${barFill}%`, backgroundColor: result.color }}
          />
        </div>
        {result.label && (
          <div className="flex items-center gap-1 shrink-0">
            <Icon className="w-3.5 h-3.5" style={{ color: result.color }} />
            <span className="text-xs font-semibold" style={{ color: result.color }}>
              {result.label}
            </span>
          </div>
        )}
      </div>

      {/* Checks list */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {result.checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: check.passed ? '#dcfce7' : '#f1f5f9',
              }}
            >
              {check.passed ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l2 2 3-3" stroke="#16a34a" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#cbd5e1' }} />
              )}
            </div>
            <span
              className="text-[11px] leading-tight"
              style={{ color: check.passed ? '#374151' : '#9ca3af' }}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {/* HaveIBeenPwned result */}
      {checking && (
        <div className="flex items-center gap-1.5 text-xs"
          style={{ color: '#6b7280' }}>
          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Checking against known breaches…
        </div>
      )}
      {!checking && pwned === true && (
        <div
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
          style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
        >
          <ShieldX className="w-3.5 h-3.5 shrink-0" />
          This password has appeared in data breaches. Please choose a different one.
        </div>
      )}
      {!checking && pwned === false && result.score >= 3 && (
        <div
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
          style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Not found in any known data breaches.
        </div>
      )}
    </div>
  )
}