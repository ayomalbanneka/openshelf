export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'hsl(var(--muted))' }}>
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-sm"
        style={{
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        {children}
      </div>
    </div>
  )
}