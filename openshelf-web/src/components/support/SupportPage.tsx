'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { CheckCircle, Loader2, Star, Sparkles, Heart, Server, BookOpen } from 'lucide-react';
import Link from 'next/link';

type Tier = 'SUPPORTER' | 'PATRON';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.38-3.37-1.38-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.52 1.05 1.52 1.05.88 1.55 2.31 1.1 2.87.84.09-.66.35-1.1.64-1.35-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.38-2.03 1-2.75-.1-.26-.44-1.31.1-2.73 0 0 .83-.27 2.7 1.05a9.13 9.13 0 0 1 4.91 0c1.87-1.32 2.7-1.05 2.7-1.05.54 1.42.2 2.47.1 2.73.63.72 1 1.63 1 2.75 0 3.95-2.35 4.81-4.59 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .26.18.59.69.48A10.1 10.1 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

// ── Checkout result banner ────────────────────────────────────────────────────

function CheckoutBanner() {
  const params = useSearchParams();
  const result = params.get('checkout');
  if (!result) return null;

  if (result === 'success') {
    return (
      <div
        className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 mb-8"
        style={{ background: 'hsl(142 71% 45% / 0.12)', color: 'hsl(142 71% 35%)' }}
      >
        <CheckCircle size={15} />
        Thank you for supporting OpenShelf! Your badge will appear on your profile shortly.
      </div>
    );
  }
  if (result === 'canceled') {
    return (
      <div
        className="rounded-xl px-4 py-3 text-sm mb-8"
        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
      >
        Checkout was canceled — no charge was made.
      </div>
    );
  }
  return null;
}

// ── Tier card ─────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  price,
  label,
  perks,
  highlight,
  loading,
  isActive,
  onSubscribe,
}: {
  tier: Tier;
  price: string;
  label: string;
  perks: string[];
  highlight: boolean;
  loading: boolean;
  isActive: boolean;
  onSubscribe: (tier: Tier) => void;
}) {
  // Use direct color values for better visibility
  const primaryColor = '#3b82f6'; // Blue-500 as fallback, adjust to your theme
  const borderColor = highlight ? primaryColor : '#e5e7eb';
  const bgColor = highlight ? 'rgba(59, 130, 246, 0.04)' : 'transparent';

  return (
    <div
      className={`rounded-2xl p-6 flex flex-col gap-5 ${highlight ? 'ring-2 ring-blue-500/20' : ''}`}
      style={{
        border: `${highlight ? '2px' : '1px'} solid ${borderColor}`,
        background: bgColor,
        boxShadow: highlight ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
      }}
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          {highlight ? (
            <Sparkles size={16} style={{ color: primaryColor }} />
          ) : (
            <Star size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
          )}
          <span className="text-sm font-semibold">{label}</span>
          {highlight && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full ml-auto"
              style={{ background: 'rgba(59, 130, 246, 0.12)', color: primaryColor }}
            >
              Most popular
            </span>
          )}
        </div>
        <p className="text-3xl font-bold">
          {price}
          <span
            className="text-sm font-normal ml-1"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            / month
          </span>
        </p>
      </div>

      <ul className="flex flex-col gap-2.5 flex-1">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm">
            <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: primaryColor }} />
            {perk}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(tier)}
        disabled={loading || isActive}
        className="h-11 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
        style={{
          background: highlight ? primaryColor : 'transparent',
          color: highlight ? 'white' : 'hsl(var(--foreground))',
          border: `${highlight ? '2px' : '1px'} solid ${borderColor}`,
          opacity: loading || isActive ? 0.6 : 1,
          cursor: loading || isActive ? 'not-allowed' : 'pointer',
        }}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {isActive ? 'Current plan' : 'Support OpenShelf'}
      </button>
    </div>
  );
}

// ── What your support funds ───────────────────────────────────────────────────

const FUND_ITEMS = [
  {
    icon: Server,
    label: 'Hosting & infrastructure',
    desc: 'Keeps the servers, storage, and CDN running.',
  },
  {
    icon: BookOpen,
    label: 'Content availability',
    desc: 'Ensures all books stay free and accessible.',
  },
  {
    icon: GithubIcon,
    label: 'Open-source development',
    desc: 'Funds maintainer time on new features and fixes.',
  },
  {
    icon: Heart,
    label: 'Community growth',
    desc: 'Helps us onboard contributors and build the platform.',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

function SupportPageInner() {
  const { user } = useAuthStore();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  const sub = user?.subscription;
  const isActive = sub?.status === 'ACTIVE' || sub?.status === 'PAST_DUE';

  const handleSubscribe = async (tier: Tier) => {
    if (!user) {
      // Redirect to login, then back here
      window.location.href = `/login?next=/support`;
      return;
    }
    setLoadingTier(tier);
    try {
      const { url } = await api.payments.checkout(tier);
      window.location.href = url;
    } catch {
      toast.error('Could not start checkout. Please try again.');
      setLoadingTier(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Suspense>
        <CheckoutBanner />
      </Suspense>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
          style={{ background: 'hsl(var(--primary) / 0.1)' }}
        >
          <Heart size={22} style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <h1 className="text-3xl font-bold mb-3">Support OpenShelf</h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
          OpenShelf is free and open-source. Subscriptions are optional — they fund hosting costs
          and unlock small perks. All content stays free for everyone, always.
        </p>
      </div>

      {/* ── Active subscription notice ────────────────────────── */}
      {isActive && (
        <div
          className="rounded-xl px-4 py-3 text-sm flex items-center justify-between mb-8"
          style={{
            background: 'hsl(142 71% 45% / 0.1)',
            border: '1px solid hsl(142 71% 45% / 0.3)',
          }}
        >
          <div className="flex items-center gap-2" style={{ color: 'hsl(142 71% 35%)' }}>
            <CheckCircle size={15} />
            You&apos;re already supporting OpenShelf as a{' '}
            {sub!.tier === 'PATRON' ? 'Patron' : 'Supporter'}. Thank you!
          </div>
          <Link
            href="/settings"
            className="text-xs font-medium underline underline-offset-2"
            style={{ color: 'hsl(142 71% 35%)' }}
          >
            Manage
          </Link>
        </div>
      )}

      {/* ── Tier cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
        <TierCard
          tier="SUPPORTER"
          price="$3"
          label="Supporter"
          highlight={false}
          loading={loadingTier === 'SUPPORTER'}
          isActive={isActive && sub?.tier === 'SUPPORTER'}
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
          loading={loadingTier === 'PATRON'}
          isActive={isActive && sub?.tier === 'PATRON'}
          onSubscribe={handleSubscribe}
          perks={[
            'Everything in Supporter',
            'Priority review queue',
            'Early access to new features',
            'Patron badge on your profile',
          ]}
        />
      </div>

      {/* ── What your support funds ──────────────────────────── */}
      <div className="mb-12">
        <h2 className="text-lg font-bold mb-5">What your support funds</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FUND_ITEMS.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
            >
              <div
                className="shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'hsl(var(--primary) / 0.08)' }}
              >
                <Icon size={16} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold mb-5">Common questions</h2>
        <div className="flex flex-col gap-4">
          {[
            {
              q: 'Is OpenShelf really free?',
              a: 'Yes. All books and features are free for every user. Subscriptions are voluntary and only fund the infrastructure.',
            },
            {
              q: 'Can I cancel at any time?',
              a: 'Absolutely. Cancel from Settings → Subscription at any time. You keep your perks until the end of the current billing period.',
            },
            {
              q: 'What payment methods are accepted?',
              a: 'All major credit and debit cards via Stripe. No card data ever touches our servers.',
            },
            {
              q: 'Will my tier affect what content I can access?',
              a: 'No. Tiers unlock profile perks and platform benefits only — never content access.',
            },
          ].map(({ q, a }) => (
            <div
              key={q}
              className="p-4 rounded-xl"
              style={{ border: '1px solid hsl(var(--border))' }}
            >
              <p className="text-sm font-semibold mb-1">{q}</p>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SupportPage() {
  return (
    <Suspense>
      <SupportPageInner />
    </Suspense>
  );
}
