'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { http } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';

type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  resource: { id: string; title: string; slug: string; type: string };
  reportedBy: { id: string; name: string; email: string };
}

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  COPYRIGHT: 'Copyright',
  INAPPROPRIATE: 'Inappropriate',
  MISINFORMATION: 'Misinformation',
  BROKEN_FILE: 'Broken file',
  OTHER: 'Other',
};

const STATUS_TABS: { value: ReportStatus | 'ALL'; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'ALL', label: 'All' },
];

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ReportStatus | 'ALL'>('OPEN');
  const limit = 15;

  const fetchReports = (status = activeTab, p = page) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ status, page: String(p), limit: String(limit) });
    http
      .get(`/admin/reports?${params}`)
      .then(({ data }) => {
        setReports(data.data);
        setTotal(data.meta.total);
        setPage(data.meta.page);
        setPages(data.meta.pages);
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load reports')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports(activeTab, 1);
  }, [activeTab]);
  useEffect(() => {
    fetchReports(activeTab, page);
  }, [page]);

  const handleTab = (tab: ReportStatus | 'ALL') => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleAction = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    setActing(reportId);
    try {
      await http.patch(`/admin/reports/${reportId}`, { status });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setTotal((t) => t - 1);
      toast.success(status === 'RESOLVED' ? 'Report resolved' : 'Report dismissed');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update report'));
    } finally {
      setActing(null);
    }
  };

  const row = 'grid grid-cols-12 gap-3 px-4 py-3 items-start text-sm';

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>
            Reports
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
            {total} {activeTab.toLowerCase()} report{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => fetchReports()}
          className="text-xs px-3 py-1.5 rounded-xl font-semibold"
          style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
        >
          Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ backgroundColor: 'var(--admin-soft)' }}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTab(tab.value)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab.value ? 'var(--admin-surface)' : 'transparent',
              color: activeTab === tab.value ? 'var(--admin-text)' : 'var(--admin-muted)',
              boxShadow: activeTab === tab.value ? 'var(--admin-card-shadow)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center justify-between gap-3 text-sm rounded-xl px-4 py-3"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
        >
          <span>{error}</span>
          <button
            onClick={() => fetchReports()}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ backgroundColor: '#fecaca', color: '#7f1d1d' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          boxShadow: 'var(--admin-card-shadow)',
        }}
      >
        <div
          className={`${row} text-xs font-bold uppercase tracking-wider`}
          style={{
            backgroundColor: 'var(--admin-soft)',
            color: 'var(--admin-muted)',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          <div className="col-span-4">Resource</div>
          <div className="col-span-2">Reason</div>
          <div className="col-span-3">Reporter</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 mx-4 my-2 rounded-xl animate-pulse"
                style={{ backgroundColor: 'var(--admin-soft)' }}
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>
            No {activeTab.toLowerCase()} reports.
          </div>
        ) : (
          reports.map((report, i) => (
            <div
              key={report.id}
              className={row}
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--admin-border)' }}
            >
              {/* Resource */}
              <div className="col-span-4 min-w-0">
                <Link
                  href={`/resources/${report.resource.slug}`}
                  target="_blank"
                  className="text-sm font-medium truncate block hover:text-blue-600 transition-colors"
                  style={{ color: 'var(--admin-text)' }}
                >
                  {report.resource.title}
                </Link>
                <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>
                  {report.resource.type.replace('_', ' ')}
                </p>
                {report.details && (
                  <p
                    className="text-xs mt-1 italic line-clamp-2"
                    style={{ color: 'var(--admin-muted)' }}
                  >
                    &ldquo;{report.details}&rdquo;
                  </p>
                )}
              </div>

              {/* Reason badge */}
              <div className="col-span-2">
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-lg"
                  style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                >
                  {REASON_LABELS[report.reason] ?? report.reason}
                </span>
              </div>

              {/* Reporter */}
              <div className="col-span-3 min-w-0">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: 'var(--admin-text)' }}
                >
                  {report.reportedBy.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>
                  {report.reportedBy.email}
                </p>
              </div>

              {/* Date */}
              <div className="col-span-1 text-xs" style={{ color: 'var(--admin-muted)' }}>
                {fmt(report.createdAt)}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-center gap-1.5">
                {activeTab === 'OPEN' || activeTab === 'ALL' ? (
                  <>
                    <button
                      onClick={() => handleAction(report.id, 'RESOLVED')}
                      disabled={acting === report.id}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
                      style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                    >
                      {acting === report.id ? '...' : 'Resolve'}
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'DISMISSED')}
                      disabled={acting === report.id}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
                      style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-muted)' }}
                    >
                      {acting === report.id ? '...' : 'Dismiss'}
                    </button>
                  </>
                ) : (
                  <span
                    className="text-xs px-2.5 py-1.5 rounded-lg"
                    style={{
                      backgroundColor:
                        report.status === 'RESOLVED' ? '#dcfce7' : 'var(--admin-soft)',
                      color: report.status === 'RESOLVED' ? '#166534' : 'var(--admin-muted)',
                    }}
                  >
                    {report.status === 'RESOLVED' ? 'Resolved' : 'Dismissed'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            Prev
          </button>
          <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
