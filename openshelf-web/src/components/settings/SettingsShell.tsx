// src/components/settings/SettingsShell.tsx
'use client';
import { useState } from 'react';
import { User, Link2, Shield, Bell, Heart, Palette, ChevronRight } from 'lucide-react';
import { ProfileSection } from './sections/ProfileSection';
import { ConnectedAccountsSection } from './sections/ConnectedAccountsSection';
import { SecuritySection } from './sections/SecuritySection';
import { NotificationsSection } from './sections/NotificationsSection';
import { SubscriptionSection } from './sections/SubscriptionSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { useAuthStore } from '@/store/auth.store';
import type { AuthState } from '@/store/auth.store';

// ── Nav definition ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    subtitle: 'Name, bio, avatar',
  },
  {
    id: 'connected',
    label: 'Connected accounts',
    icon: Link2,
    subtitle: 'Google, GitHub',
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    subtitle: 'Password, sessions',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    subtitle: 'In-app alerts',
  },
  {
    id: 'subscription',
    label: 'Subscription',
    icon: Heart,
    subtitle: 'Support tier',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    subtitle: 'Theme',
  },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]['id'];

const SECTION_MAP: Record<SectionId, React.ReactNode> = {
  profile: <ProfileSection />,
  connected: <ConnectedAccountsSection />,
  security: <SecuritySection />,
  notifications: <NotificationsSection />,
  subscription: <SubscriptionSection />,
  appearance: <AppearanceSection />,
};

const SECTION_TITLES: Record<SectionId, { title: string; subtitle: string }> = {
  profile: { title: 'Profile', subtitle: 'Manage your public profile information.' },
  connected: { title: 'Connected accounts', subtitle: 'Social accounts linked to your login.' },
  security: { title: 'Security', subtitle: 'Manage your password and account access.' },
  notifications: {
    title: 'Notifications',
    subtitle: 'Choose which in-app notifications you receive.',
  },
  subscription: { title: 'Subscription', subtitle: 'Manage your current support tier.' },
  appearance: { title: 'Appearance', subtitle: 'Customise how OpenShelf looks for you.' },
};

// ── Sidebar nav item ──────────────────────────────────────────────────────────

function NavItem({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group"
      style={{
        background: active ? 'hsl(var(--primary) / 0.08)' : 'transparent',
        color: active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{
          background: active ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--muted))',
          color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        }}
      >
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.label}</p>
        <p
          className="text-xs truncate"
          style={{ color: active ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--muted-foreground))' }}
        >
          {item.subtitle}
        </p>
      </div>
      <ChevronRight
        size={14}
        className="shrink-0 transition-opacity"
        style={{
          opacity: active ? 1 : 0,
          color: 'hsl(var(--primary))',
        }}
      />
    </button>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function SettingsShell() {
  const [active, setActive] = useState<SectionId>('profile');
  const { title, subtitle } = SECTION_TITLES[active];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 flex gap-8 items-start">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className="w-64 shrink-0 sticky top-20 rounded-2xl p-2"
        style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
      >
        {/* User identity pill */}
        <div
          className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl"
          style={{ background: 'hsl(var(--muted) / 0.5)' }}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {/* Rendered inside the client component so useAuthStore is safe */}
            <UserInitial />
          </div>
          <div className="min-w-0">
            <UserNameDisplay />
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={active === item.id}
              onClick={() => setActive(item.id)}
            />
          ))}
        </nav>
      </aside>

      {/* ── Content panel ────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {subtitle}
          </p>
        </div>
        <div>{SECTION_MAP[active]}</div>
      </div>
    </div>
  );
}

// ── Small client helpers (need auth store) ────────────────────────────────────

function UserInitial() {
  const user = useAuthStore((s: AuthState) => s.user);
  return <>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</>;
}

function UserNameDisplay() {
  const user = useAuthStore((s: AuthState) => s.user);
  return (
    <>
      <p className="text-sm font-medium truncate">{user?.name ?? '—'}</p>
      <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {user?.email ?? ''}
      </p>
    </>
  );
}
