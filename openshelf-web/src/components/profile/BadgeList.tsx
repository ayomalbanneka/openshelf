'use client';
import {
  Upload,
  TrendingUp,
  Library,
  Eye,
  BookOpen,
  Download,
  Star,
  Heart,
  Sparkles,
} from 'lucide-react';

interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'supporter' | 'patron';
  awardedAt: string | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  upload: Upload,
  'trending-up': TrendingUp,
  library: Library,
  eye: Eye,
  'book-open': BookOpen,
  download: Download,
  star: Star,
  heart: Heart,
  sparkles: Sparkles,
};

const TIER_STYLES: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  bronze: {
    bg: 'hsl(25 95% 53% / 0.08)',
    border: 'hsl(25 95% 53% / 0.3)',
    icon: 'hsl(25 95% 45%)',
    label: 'hsl(25 95% 35%)',
  },
  silver: {
    bg: 'hsl(220 9% 46% / 0.08)',
    border: 'hsl(220 9% 46% / 0.3)',
    icon: 'hsl(220 9% 40%)',
    label: 'hsl(220 9% 30%)',
  },
  gold: {
    bg: 'hsl(45 93% 47% / 0.1)',
    border: 'hsl(45 93% 47% / 0.35)',
    icon: 'hsl(45 93% 38%)',
    label: 'hsl(45 93% 28%)',
  },
  supporter: {
    bg: 'hsl(var(--primary) / 0.08)',
    border: 'hsl(var(--primary) / 0.3)',
    icon: 'hsl(var(--primary))',
    label: 'hsl(var(--primary))',
  },
  patron: {
    bg: 'hsl(270 95% 60% / 0.08)',
    border: 'hsl(270 95% 60% / 0.3)',
    icon: 'hsl(270 95% 50%)',
    label: 'hsl(270 95% 40%)',
  },
};

function BadgeCard({ badge }: { badge: Badge }) {
  const Icon = ICON_MAP[badge.icon] ?? Star;
  const styles = TIER_STYLES[badge.tier] ?? TIER_STYLES.bronze;

  const awardedDate = badge.awardedAt
    ? new Date(badge.awardedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      title={badge.description}
      className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all cursor-default group"
      style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: styles.border }}
      >
        <Icon size={18} style={{ color: styles.icon }} />
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold leading-tight" style={{ color: styles.label }}>
          {badge.label}
        </p>
        {awardedDate && (
          <p
            className="text-[10px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: styles.label }}
          >
            {awardedDate}
          </p>
        )}
      </div>
    </div>
  );
}

export function BadgeList({ badges }: { badges: Badge[] }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Badges</p>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}
