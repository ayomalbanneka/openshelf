import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Resource preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://openshelf.app';

export default async function OGImage({ params }: { params: { slug: string } }) {
  let title = 'OpenShelf Resource';
  let author = '';
  let type = '';
  let thumbnailUrl: string | null = null;

  try {
    const res = await fetch(`${API_URL}/resources/${params.slug}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const r = await res.json();
      title = r.title ?? title;
      author = r.uploader?.name ?? r.author ?? '';
      type = r.type ?? '';
      thumbnailUrl = r.thumbnailUrl ?? null;
    }
  } catch {
    /* fall through to defaults */
  }

  const TYPE_COLORS: Record<string, string> = {
    BOOK: '#4f46e5',
    PAPER: '#0891b2',
    AUDIO: '#7c3aed',
    COURSE: '#b45309',
    default: '#1e293b',
  };
  const accentColor = TYPE_COLORS[type] ?? TYPE_COLORS.default;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#0f172a',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Left: thumbnail */}
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnailUrl} alt="" style={{ width: 280, height: '100%', objectFit: 'cover' }} />
      )}

      {/* Right: text content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 64px',
        }}
      >
        {/* Top: type badge */}
        {type && (
          <div
            style={{
              display: 'inline-flex',
              background: accentColor,
              color: '#fff',
              borderRadius: 8,
              padding: '6px 16px',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.05em',
              alignSelf: 'flex-start',
            }}
          >
            {type}
          </div>
        )}

        {/* Middle: title */}
        <div
          style={{
            fontSize: title.length > 60 ? 44 : 56,
            fontWeight: 800,
            color: '#f1f5f9',
            lineHeight: 1.2,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {title.length > 90 ? title.slice(0, 88) + '…' : title}
        </div>

        {/* Bottom: author + branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {author && <div style={{ fontSize: 28, color: '#94a3b8' }}>by {author}</div>}
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: accentColor,
              marginLeft: 'auto',
            }}
          >
            OpenShelf
          </div>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
