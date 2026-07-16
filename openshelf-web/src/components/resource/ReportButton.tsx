'use client';
import { useState } from 'react';
import { Flag } from 'lucide-react';
import { http } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/errors';

const REASONS = [
  { value: 'SPAM', label: 'Spam or advertising' },
  { value: 'COPYRIGHT', label: 'Copyright violation' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'MISINFORMATION', label: 'Misinformation' },
  { value: 'BROKEN_FILE', label: 'Broken or unreadable file' },
  { value: 'OTHER', label: 'Other' },
];

export function ReportButton({
  slug,
  buttonClassName,
  buttonStyle,
}: {
  slug: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async () => {
    if (!reason) return setError('Please select a reason');
    setLoading(true);
    setError('');
    try {
      await http.post(`/resources/${slug}/report`, { reason, details });
      setDone(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to submit report'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setReason('');
    setDetails('');
    setError('');
    setDone(false);
  };

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 text-xs transition-colors ${buttonClassName || ''}`}
        style={buttonStyle || { color: 'hsl(var(--muted-foreground))' }}
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            {done ? (
              <div className="text-center flex flex-col items-center gap-3 py-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#dcfce7' }}
                >
                  <Flag className="w-5 h-5" style={{ color: '#166534' }} />
                </div>
                <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  Report submitted
                </h3>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Thank you. Our moderation team will review this shortly.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 text-sm font-medium px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    Report this resource
                  </h3>
                  <button
                    onClick={handleClose}
                    className="text-sm px-2 py-1 rounded-lg"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <div
                    className="text-sm rounded-xl px-3 py-2"
                    style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}
                  >
                    {error}
                  </div>
                )}

                {/* Reason selector */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    Reason
                  </label>
                  <div className="flex flex-col gap-1">
                    {REASONS.map((r) => (
                      <label
                        key={r.value}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-sm transition-colors"
                        style={{
                          backgroundColor: reason === r.value ? '#eff6ff' : 'transparent',
                          color: reason === r.value ? '#1e40af' : 'hsl(var(--foreground))',
                          border: `1px solid ${reason === r.value ? '#bfdbfe' : 'transparent'}`,
                        }}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r.value}
                          checked={reason === r.value}
                          onChange={() => setReason(r.value)}
                          className="accent-blue-600"
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Optional details */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    Additional details <span style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                    className="rounded-xl px-3 py-2 text-sm outline-none resize-none"
                    style={inputStyle}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleClose}
                    className="flex-1 h-10 rounded-xl text-sm font-semibold"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--foreground))',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !reason}
                    className="flex-1 h-10 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                    style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                  >
                    {loading ? 'Submitting…' : 'Submit report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
