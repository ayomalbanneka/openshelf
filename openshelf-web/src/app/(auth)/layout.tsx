import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-150 xl:w-120 shrink-0 flex-col justify-between p-12"
        style={{ backgroundColor: '#0f172a' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#2563eb' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Open<span style={{ color: '#60a5fa' }}>Shelf</span>
          </span>
        </Link>

        {/* Center quote */}
        <div>
          <blockquote className="text-2xl font-medium leading-relaxed mb-4" style={{ color: '#e2e8f0' }}>
            &ldquo;A library is not a luxury but one of the necessities of life.&rdquo;
          </blockquote>
          <p className="text-sm" style={{ color: '#64748b' }}>— Henry Ward Beecher</p>
        </div>

        {/* Bottom stats */}
        <div className="flex gap-8">
          {[
            { value: '10K+', label: 'Resources' },
            { value: '2K+',  label: 'Members' },
            { value: '50+',  label: 'Languages' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="flex-1 flex items-center justify-center px-4 py-10"
        style={{ backgroundColor: 'hsl(var(--muted))' }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8"
          style={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          {children}
        </div>
      </div>

    </div>
  )
}