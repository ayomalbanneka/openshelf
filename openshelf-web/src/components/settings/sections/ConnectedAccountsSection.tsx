// src/components/settings/sections/ConnectedAccountsSection.tsx
'use client';
import { useAuthStore } from '@/store/auth.store';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.46-1.2-1.12-1.52-1.12-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.38-2.03 1-2.75-.1-.26-.44-1.31.1-2.72 0 0 .84-.28 2.75 1.05.8-.23 1.65-.35 2.5-.35s1.7.12 2.5.35c1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.46.1 2.72.63.72 1 1.63 1 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.96.68 1.94 0 1.4-.01 2.53-.01 2.88 0 .27.18.59.69.48A10.28 10.28 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function ProviderRow({
  icon,
  label,
  description,
  connected,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  connected: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl"
      style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'hsl(var(--muted))' }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {description}
          </p>
        </div>
      </div>
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
        style={
          connected
            ? { background: 'hsl(142 71% 45% / 0.12)', color: 'hsl(142 71% 35%)' }
            : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
        }
      >
        {connected ? 'Connected' : 'Not connected'}
      </span>
    </div>
  );
}

export function ConnectedAccountsSection() {
  const { user } = useAuthStore();
  const googleConnected = user?.oauthProvider === 'GOOGLE';
  const githubConnected = user?.oauthProvider === 'GITHUB';

  return (
    <div className="flex flex-col gap-3">
      <ProviderRow
        icon={<GoogleIcon />}
        label="Google"
        description={
          googleConnected ? 'Used to sign in to your account' : 'Not linked to your account'
        }
        connected={googleConnected}
      />
      <ProviderRow
        icon={<GitHubIcon size={18} />}
        label="GitHub"
        description={
          githubConnected ? 'Used to sign in to your account' : 'Not linked to your account'
        }
        connected={githubConnected}
      />
      <p className="text-xs pt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
        To link or change a provider, sign out and use the OAuth button on the login page.
      </p>
    </div>
  );
}
