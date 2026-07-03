'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { CheckCircle, Loader2, Star, Sparkles, RefreshCw } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tier = 'SUPPORTER' | 'PATRON'

interface TierCardProps {
  tier: Tier
  price: string
  label: string
  perks: string[]
  highlight: boolean
  loading: boolean
  onSubscribe: (tier: Tier) => void
}

// ── Tier card ─────────────────────────────────────────────────────────────────

function TierCard({ tier, price, label, perks, highlight, loading, onSubscribe }: TierCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        border: highlight
          ? '1.5px solid hsl(var(--primary))'
          : '1px solid hsl(var(--border))',
        background: highlight
          ? 'hsl(var(--primary) / 0.04)'
          : 'hsl(var(--card))',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {highlight
              ? <Sparkles size={15} style={{ color: 'hsl(var(--primary))' }} />
              : <Star size={15} style={{ color: 'hsl(var(--muted-foreground))' }} />
            }
            <span className="text-sm font-semibold">{label}</span>
          </div>
          <p className="text-2xl font-bold">
            {price}
            <span className="text-sm font-normal ml-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              / month
            </span>
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm">
            <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
            {perk}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(tier)}
        disabled={loading}
        className="mt-auto h-10 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
        style={{
          background: highlight ? 'hsl(var(--primary))' : 'transparent',
          color: highlight ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
          border: highlight ? 'none' : '1px solid hsl(var(--border))',
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Support OpenShelf
      </button>
    </div>
  )
}

// ── Active subscription view ───────────────────────────────────────────────────

function ActiveSubscription({
  tier,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  onManage,
  onSync,
  loading,
  syncing,
}: {
  tier: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  onManage: () => void
  onSync: () => void
  loading: boolean
  syncing: boolean
}) {
  const renewDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    : null

  const statusColour: Record<string, string> = {
    ACTIVE: 'hsl(142 71% 45%)',
    PAST_DUE: 'hsl(38 92% 50%)',
    CANCELED: 'hsl(var(--muted-foreground))',
    INCOMPLETE: 'hsl(var(--muted-foreground))',
  }

    return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} style={{ color: 'hsl(var(--primary))' }} />
          <span className="text-sm font-semibold">
            {tier === 'PATRON' ? 'Patron' : 'Supporter'}
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: `${statusColour[status]}22`,
              color: statusColour[status],
            }}
          >
            {cancelAtPeriodEnd
              ? 'Cancels soon'
              : status === 'PAST_DUE' ? 'Past due' : status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Manual sync button — lets the user pull latest state from Stripe */}
        <button
          onClick={onSync}
          disabled={syncing}
          title="Sync with Stripe"
          className="flex shrink-0 items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          style={{
            color: 'hsl(var(--muted-foreground))',
            border: '1px solid hsl(var(--border))',
            background: 'transparent',
            opacity: syncing ? 0.5 : 1,
            cursor: syncing ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
          Sync with Stripe
        </button>
      </div>

      {renewDate && (
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {cancelAtPeriodEnd
            ? `Access ends on ${renewDate}. No further charges.`
            : `Renews on ${renewDate}`}
        </p>
      )}

      {status === 'PAST_DUE' && (
        <p className="text-sm" style={{ color: 'hsl(38 92% 50%)' }}>
          Your last payment failed. Update your payment method to keep your benefits.
        </p>
      )}

      <button
        onClick={onManage}
        disabled={loading}
        className="h-10 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
        style={{
          background: 'transparent',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Manage subscription
      </button>
    </div>
  )
}

// ── Checkout result banner ────────────────────────────────────────────────────

function CheckoutBanner() {
  const params = useSearchParams()
  const result = params.get('checkout')

  if (!result) return null

  if (result === 'success') {
    return (
      <div
        className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 mb-4"
        style={{ background: 'hsl(142 71% 45% / 0.12)', color: 'hsl(142 71% 35%)' }}
      >
        <CheckCircle size={15} />
        Thank you for supporting OpenShelf! Your badge will appear on your profile shortly.
      </div>
    )
  }

  if (result === 'canceled') {
    return (
      <div
        className="rounded-xl px-4 py-3 text-sm mb-4"
        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
      >
        Checkout was canceled — no charge was made.
      </div>
    )
  }

  return null
}

// ── Main component ────────────────────────────────────────────────────────────

function SupportSettingsInner() {
  const { user, fetchMe } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const params = useSearchParams()

  // On mount: sync with Stripe whenever the subscription is active, not just
  // when ?portal=return is present. This covers the case where the user closes
  // the portal tab or uses the browser back button instead of the return link.
  useEffect(() => {
    const fromPortal   = params.get('portal') === 'return'
    const fromCheckout = params.get('checkout') === 'success'
    const sub          = user?.subscription

    if (fromPortal || fromCheckout) {
      handleSync({ silent: true })
    } else if (sub?.status === 'ACTIVE' || sub?.status === 'PAST_DUE') {
      handleSync({ silent: true })
    } else {
      fetchMe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSync = async ({ silent = false } = {}) => {
    setSyncing(true)
    try {
      await api.payments.sync();
      // Re-fetch our local user state from the DB (now updated)
      await fetchMe()
      if (!silent) toast.success('Subscription synced.')
    } catch {
      if (!silent) toast.error('Could not sync subscription. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const handleSubscribe = async (tier: Tier) => {
    setLoading(true)
    try {
      const { url } = await api.payments.checkout(tier)
      window.location.href = url
    } catch {
      toast.error('Could not start checkout. Please try again.')
      setLoading(false)
    }
  }

  const handleManage = async () => {
    setLoading(true)
    try {
      const { url } = await api.payments.portal()
      // Append portal=return so we auto-sync when they come back
      window.location.href = url
    } catch {
      toast.error('Could not open billing portal. Please try again.')
      setLoading(false)
    }
  }

  const sub = user?.subscription
  const isActive = sub?.status === 'ACTIVE' || sub?.status === 'PAST_DUE'

  return (
    <div className="flex flex-col gap-4">
      <Suspense>
        <CheckoutBanner />
      </Suspense>

      {isActive ? (
        <ActiveSubscription
          tier={sub!.tier}
          status={sub!.status}
          currentPeriodEnd={sub!.currentPeriodEnd}
          cancelAtPeriodEnd={sub!.cancelAtPeriodEnd}
          onManage={handleManage}
          onSync={handleSync}
          loading={loading}
          syncing={syncing}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TierCard
            tier="SUPPORTER"
            price="$3"
            label="Supporter"
            highlight={false}
            loading={loading}
            onSubscribe={handleSubscribe}
            perks={[
              'Supporter badge on your profile',
              'Higher upload size limit',
              'Listed on the public Supporters page',
            ]}
          />
          <TierCard
            tier="PATRON"
            price="$8"
            label="Patron"
            highlight={true}
            loading={loading}
            onSubscribe={handleSubscribe}
            perks={[
              'Everything in Supporter',
              'Priority review queue',
              'Early access to new features',
            ]}
          />
        </div>
      )}

      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
        OpenShelf is free and open-source. Subscriptions fund hosting costs only —
        all content remains free for everyone.
      </p>
    </div>
  )
}

export function SupportSettings() {
  return (
    <Suspense>
      <SupportSettingsInner />
    </Suspense>
  )
}