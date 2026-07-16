interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void; // client-side
  buildUrl?: (page: number) => string; // server-side (anchor links)
}

export function Pagination({ currentPage, totalPages, onPageChange, buildUrl }: Props) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push('...');
    }
  }

  const btnStyle = (active: boolean) =>
    active
      ? { backgroundColor: '#2563eb', color: '#fff' }
      : {
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        };

  const renderPage = (p: number | '...', i: number) => {
    if (p === '...') {
      return (
        <span
          key={`dots-${i}`}
          className="px-2 text-sm"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          …
        </span>
      );
    }

    const isActive = p === currentPage;
    const cls = `h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors`;

    if (buildUrl) {
      return (
        <a key={p} href={buildUrl(p)} className={cls} style={btnStyle(isActive)}>
          {p}
        </a>
      );
    }

    return (
      <button key={p} onClick={() => onPageChange?.(p)} className={cls} style={btnStyle(isActive)}>
        {p}
      </button>
    );
  };

  const navCls = `px-3 py-2 rounded-lg text-sm font-medium transition-colors
    disabled:opacity-30 disabled:cursor-not-allowed`;
  const navStyle = {
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      {buildUrl ? (
        currentPage > 1 ? (
          <a href={buildUrl(currentPage - 1)} className={navCls} style={navStyle}>
            ← Prev
          </a>
        ) : (
          <span className={`${navCls} opacity-30 cursor-not-allowed`} style={navStyle}>
            ← Prev
          </span>
        )
      ) : (
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage === 1}
          className={navCls}
          style={navStyle}
        >
          ← Prev
        </button>
      )}

      {pages.map((p, i) => renderPage(p, i))}

      {buildUrl ? (
        currentPage < totalPages ? (
          <a href={buildUrl(currentPage + 1)} className={navCls} style={navStyle}>
            Next →
          </a>
        ) : (
          <span className={`${navCls} opacity-30 cursor-not-allowed`} style={navStyle}>
            Next →
          </span>
        )
      ) : (
        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={navCls}
          style={navStyle}
        >
          Next →
        </button>
      )}
    </div>
  );
}
