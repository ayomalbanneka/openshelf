'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/errors';

export function CreateClubButton() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const club = await api.clubs.create({ name, description, isPublic });
      setOpen(false);
      setName('');
      setDesc('');
      router.push(`/clubs/${club.slug}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create club'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Start a club
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
      >
        Start a club
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
            style={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Start a reading club</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-xl leading-none"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  Club name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sri Lankan Readers"
                  className="h-10 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What is this club about?"
                  rows={3}
                  className="rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                Make this club public
              </label>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating…' : 'Create club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
