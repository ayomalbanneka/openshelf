// src/components/settings/sections/SubscriptionSection.tsx
'use client'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import {
  Sparkles, Star, Loader2, CheckCircle2, AlertTriangle,
  XCircle, Clock, CreditCard, RefreshCw, ExternalLink, Heart,
} from 'lucide-react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type SubStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE'
type SubTier   = 'SUPPORTER' | 'PATRON'

interface SubState {
  tier:              SubTier
  status:            SubStatus
  currentPeriodEnd:  string | null
  cancelAtPeriodEnd: boolean
}

// ── Status config — single source of truth for all status-driven UI ───────────

const STATUS_CONFIG: Record<SubStatus, {
  icon:        React.ElementType
  iconColor:   string
  badgeBg:     string
  badgeText:   string
  borderColor: string
  bannerBg:    string
  label:       string
  headline:    string
  body:        string
  cta?:        string
}> = {
  ACTIVE: {
    icon:        CheckCircle2,
    iconColor:   'hsl(142 71% 45%)',
    badgeBg:     'hsl(142 71% 45% / 0.12)',
    badgeText:   'hsl(142 71% 32%)',
    borderColor: 'hsl(142 71% 45% / 0.25)',
    bannerBg:    'hsl(142 71% 45% / 0.06)',
    label:       'Active',
    headline:    'Your subscription is active',
    body:        'Thank you for supporting OpenShelf. Your perks are live on your profile.',
  },
  PAST_DUE: {
    icon:        AlertTriangle,
    iconColor:   'hsl(38 92% 50%)',
    badgeBg:     'hsl(38 92% 50% / 0.12)',
    badgeText:   'hsl(38 92% 35%)',
    borderColor: 'hsl(38 92% 50% / 0.35)',
    bannerBg:    'hsl(38 92% 50% / 0.06)',
    label:       'Past due',
    headline:    'Payment failed',
    body:        'Your last payment did not go through. Update your payment method to keep your benefits — Stripe will retry automatically.',
    cta:         'Update payment method',
  },
  CANCELED: {
    icon:        XCircle,
    iconColor:   'hsl(var(--muted-foreground))',
    badgeBg:     'hsl(var(--muted))',
    badgeText:   'hsl(var(--muted-foreground))',
    borderColor: 'hsl(var(--border))',
    bannerBg:    'hsl(var(--muted) / 0.4)',
    label:       'Canceled',
    headline:    'Subscription canceled',
    body:        'Your subscription has ended. You can resubscribe any time to regain your perks.',
    cta:         'Resubscribe',
  },
  INCOMPLETE: {
    icon:        Clock,
    iconColor:   'hsl(217 91% 60%)',
    badgeBg:     'hsl(217 91% 60% / 0.12)',
    badgeText:   'hsl(217 91% 40%)',
    borderColor: 'hsl(217 91% 60% / 0.25)',
    bannerBg:    'hsl(217 91% 60% / 0.06)',
    label:       'Incomplete',
    headline:    'Payment pending',
    body:        'Your subscription setup is not complete. This usually means the initial payment is still processing or requires action.',
    cta:         'Complete payment',
  },
}

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_PERKS: Record<SubTier, string[]> = {
  SUPPORTER: [
    'Supporter badge on your profile',
    'Higher upload size limit',
    'Listed on the public Supporters page',
  ],
  PATRON: [
    'Patron badge on your profile',
    'Higher upload size limit',
    'Listed on the public Supporters page',
    'Priority review queue',
    'Early access to new features',
  ],
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SubStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
      style={{ background: cfg.badgeBg, color: cfg.badgeText }}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  )
}

function TierBadge({ tier }: { tier: SubTier }) {
  return tier === 'PATRON' ? (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
      style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
    >
      <Sparkles size={12} />
      Patron
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
    >
      <Star size={12} />
      Supporter
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SubscriptionSection() {
  const { user, fetchMe } = useAuthStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchMe() }, [fetchMe])

  const sub      = user?.subscription as SubState | null | undefined
  const isActive = sub?.status === 'ACTIVE' || sub?.status === 'PAST_DUE' || sub?.status === 'INCOMPLETE'

  const handleManage = async () => {
    setLoading(true)
    try {
      const { url } = await api.payments.portal()
      window.location.href = url
    } catch {
      toast.error('Could not open billing portal. Please try again.')
      setLoading(false)
    }
  }

  // ── No subscription ───────────────────────────────────────────────────────

  if (!sub || sub.status === 'CANCELED') {
    return (
      <div className="flex flex-col gap-6">

        {/* Canceled state — show what they had */}
        {sub?.status === 'CANCELED' && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{
              border: `1px solid ${STATUS_CONFIG.CANCELED.borderColor}`,
              background: STATUS_CONFIG.CANCELED.bannerBg,
            }}
          >
            <XCircle size={18} className="mt-0.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <div>
              <p className="text-sm font-semibold">Your subscription has ended</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Your {sub.tier === 'PATRON' ? 'Patron' : 'Supporter'} perks are no longer active.
                Resubscribe any time to get them back.
              </p>
            </div>
          </div>
        )}

        {/* CTA card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid hsl(var(--border))' }}
        >
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: 'hsl(var(--primary) / 0.06)', borderBottom: '1px solid hsl(var(--border))' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'hsl(var(--primary) / 0.12)' }}
            >
              <Heart size={18} style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div>
              <p className="text-sm font-semibold">Support OpenShelf</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Keep the project running and unlock perks
              </p>
            </div>
          </div>
          <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ background: 'hsl(var(--card))' }}>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              From $3 / month · Cancel any time
            </p>
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 w-full sm:w-auto justify-center"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {sub?.status === 'CANCELED' ? 'Resubscribe' : 'View plans'}
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          All content on OpenShelf is free. Subscriptions fund hosting costs only — no content is ever paywalled.
        </p>
      </div>
    )
  }

  // ── Active / Past due / Incomplete ────────────────────────────────────────

  const cfg        = STATUS_CONFIG[sub.status]
  const StatusIcon = cfg.icon

  const renewDate = sub.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const daysRemaining = sub.currentPeriodEnd
    ? Math.max(0, Math.ceil(
        (new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    : null

  return (
    <div className="flex flex-col gap-6">

      {/* ── Status banner ──────────────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${cfg.borderColor}` }}
      >
        {/* Header row - improved layout */}
        <div
          className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ background: cfg.bannerBg, borderBottom: `1px solid ${cfg.borderColor}` }}
        >
          <div className="flex items-center gap-2.5">
            <StatusIcon size={18} style={{ color: cfg.iconColor }} />
            <p className="text-sm font-semibold">{cfg.headline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TierBadge tier={sub.tier} />
            <StatusBadge status={sub.status} />
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4" style={{ background: 'hsl(var(--card))' }}>

          {/* Explanation */}
          <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {cfg.body}
          </p>

          {/* Period info - improved layout */}
          {renewDate && (
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg gap-2"
              style={{ background: 'hsl(var(--muted) / 0.5)' }}
            >
              <div className="flex items-center gap-2">
                <RefreshCw size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {sub.cancelAtPeriodEnd
                    ? 'Access ends'
                    : sub.status === 'ACTIVE'
                    ? 'Next renewal'
                    : 'Period ends'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{renewDate}</span>
                {daysRemaining !== null && (
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full"
                    style={{
                      background: daysRemaining <= 3
                        ? 'hsl(38 92% 50% / 0.15)'
                        : 'hsl(var(--muted))',
                      color: daysRemaining <= 3
                        ? 'hsl(38 92% 35%)'
                        : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {daysRemaining === 0 ? 'Today' : `${daysRemaining}d`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Scheduled cancellation callout - improved */}
          {sub.cancelAtPeriodEnd && sub.status === 'ACTIVE' && (
            <div
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: 'hsl(38 92% 50% / 0.08)', border: '1px solid hsl(38 92% 50% / 0.2)' }}
            >
              <Clock size={16} className="mt-0.5 shrink-0" style={{ color: 'hsl(38 92% 50%)' }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'hsl(38 92% 35%)' }}>
                  Cancellation scheduled
                </p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'hsl(38 92% 40%)' }}>
                  Your subscription will not renew. You keep all perks until {renewDate ?? 'the end of your billing period'}.
                  You can reactivate at any time from the billing portal.
                </p>
              </div>
            </div>
          )}

          {/* Incomplete action callout - improved */}
          {sub.status === 'INCOMPLETE' && (
            <div
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: 'hsl(217 91% 60% / 0.08)', border: '1px solid hsl(217 91% 60% / 0.2)' }}
            >
              <CreditCard size={16} className="mt-0.5 shrink-0" style={{ color: 'hsl(217 91% 50%)' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'hsl(217 91% 35%)' }}>
                Open the billing portal to complete your payment. Your perks will activate once payment is confirmed.
              </p>
            </div>
          )}

          {/* Manage button - improved styles */}
          <button
            onClick={handleManage}
            disabled={loading}
            className={`
              h-11 w-full rounded-xl text-sm font-medium flex items-center justify-center gap-2 
              transition-all duration-200 hover:opacity-90 active:scale-[0.98]
              ${loading ? 'opacity-60 cursor-not-allowed' : ''}
              ${sub.status === 'PAST_DUE' || sub.status === 'INCOMPLETE'
                ? 'text-white shadow-sm'
                : sub.cancelAtPeriodEnd
                  ? 'border-2 border-primary/20 hover:border-primary/40'
                  : 'border border-border hover:border-primary/30'
              }
            `}
            style={{
              background: sub.status === 'PAST_DUE' || sub.status === 'INCOMPLETE'
                ? cfg.iconColor
                : sub.cancelAtPeriodEnd
                  ? 'transparent'
                  : 'transparent',
              color: sub.status === 'PAST_DUE' || sub.status === 'INCOMPLETE'
                ? '#ffffff'
                : 'hsl(var(--foreground))',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {sub.status === 'PAST_DUE' ? (
                  <>
                    <CreditCard size={16} />
                    Update payment method
                  </>
                ) : sub.status === 'INCOMPLETE' ? (
                  <>
                    <CreditCard size={16} />
                    Complete payment
                  </>
                ) : sub.cancelAtPeriodEnd ? (
                  <>
                    <RefreshCw size={16} />
                    Reactivate subscription
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Manage subscription
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Perks list ─────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5"
        style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide mb-4"
          style={{ color: 'hsl(var(--muted-foreground))' }}>
          Your perks
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {TIER_PERKS[sub.tier].map((perk) => (
            <div key={perk} className="flex items-center gap-2.5">
              <CheckCircle2
                size={16}
                className="shrink-0"
                style={{
                  color: isActive && !sub.cancelAtPeriodEnd
                    ? 'hsl(142 71% 45%)'
                    : 'hsl(var(--muted-foreground))',
                }}
              />
              <span
                className="text-sm"
                style={{
                  color: isActive && !sub.cancelAtPeriodEnd
                    ? 'hsl(var(--foreground))'
                    : 'hsl(var(--muted-foreground))',
                  textDecoration: sub.cancelAtPeriodEnd ? 'line-through' : 'none',
                  textDecorationColor: 'hsl(var(--muted-foreground) / 0.5)',
                }}
              >
                {perk}
              </span>
            </div>
          ))}
        </div>
        {sub.cancelAtPeriodEnd && (
          <p className="text-xs mt-4 pt-3 border-t border-border" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Perks will deactivate on {renewDate ?? 'your cancellation date'}.
          </p>
        )}
      </div>

      {/* ── What happens next timeline ──────────────────────────── */}
      {(sub.status === 'PAST_DUE' || sub.status === 'INCOMPLETE' || sub.cancelAtPeriodEnd) && (
        <div
          className="rounded-xl p-5"
          style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-4"
            style={{ color: 'hsl(var(--muted-foreground))' }}>
            What happens next
          </p>

          <div className="space-y-4">
            {/* Timeline items - improved */}
            {sub.status === 'PAST_DUE' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(38 92% 50% / 0.15)', border: '2px solid hsl(38 92% 50%)' }}>
                    <AlertTriangle size={14} style={{ color: 'hsl(38 92% 50%)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payment failed</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Stripe will retry your card automatically over the next few days.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(217 91% 60% / 0.15)', border: '2px solid hsl(217 91% 60%)' }}>
                    <CreditCard size={14} style={{ color: 'hsl(217 91% 60%)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Update your card</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Open the billing portal to add a new payment method.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--muted))', border: '2px solid transparent' }}>
                    <CheckCircle2 size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Subscription resumes</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Once payment succeeds your perks remain active without interruption.</p>
                  </div>
                </div>
              </>
            )}

            {sub.status === 'INCOMPLETE' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(217 91% 60% / 0.15)', border: '2px solid hsl(217 91% 60%)' }}>
                    <Clock size={14} style={{ color: 'hsl(217 91% 60%)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payment pending</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Your initial payment needs to be confirmed before perks activate.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(217 91% 60% / 0.15)', border: '2px solid hsl(217 91% 60%)' }}>
                    <CreditCard size={14} style={{ color: 'hsl(217 91% 60%)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Complete payment</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Open the billing portal to authorise or retry the payment.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--muted))', border: '2px solid transparent' }}>
                    <CheckCircle2 size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Perks activate</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Your badge and other perks will appear on your profile immediately.</p>
                  </div>
                </div>
              </>
            )}

            {sub.cancelAtPeriodEnd && sub.status === 'ACTIVE' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(142 71% 45% / 0.15)', border: '2px solid hsl(142 71% 45%)' }}>
                    <CheckCircle2 size={14} style={{ color: 'hsl(142 71% 45%)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Perks active now</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>All your perks remain live until the cancellation date.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(38 92% 50% / 0.15)', border: '2px solid hsl(38 92% 50%)' }}>
                    <Clock size={14} style={{ color: 'hsl(38 92% 50%)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Cancellation on {renewDate ?? '—'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>No charge will be made. Your subscription ends automatically.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--muted))', border: '2px solid transparent' }}>
                    <XCircle size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Perks deactivate</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Your badge and other perks will be removed after the end date.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}