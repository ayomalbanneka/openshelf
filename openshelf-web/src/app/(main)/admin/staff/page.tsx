'use client';
import { useEffect, useState } from 'react';
import { http } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';

type StaffRole = 'ADMIN' | 'MODERATOR';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: StaffRole;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string };
}

const ROLE_STYLE: Record<StaffRole, { backgroundColor: string; color: string }> = {
  ADMIN: { backgroundColor: '#fee2e2', color: '#991b1b' },
  MODERATOR: { backgroundColor: '#fef3c7', color: '#92400e' },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const isExpiringSoon = (iso: string) => new Date(iso).getTime() - Date.now() < 8 * 60 * 60 * 1000; // less than 8 hours

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('MODERATOR');
  const [inviting, setInviting] = useState(false);

  const fetchStaff = () => {
    setLoading(true);
    setError('');
    http
      .get('/admin/staff')
      .then((res) => {
        setStaff(res.data.staff);
        setInvites(res.data.pendingInvites);
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load staff')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return toast.error('Email is required');
    setInviting(true);
    try {
      const { data } = await http.post('/admin/staff/invite', {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      toast.success(data.message);
      setShowModal(false);
      setInviteEmail('');
      setInviteRole('MODERATOR');
      fetchStaff();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to send invite'));
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (member: StaffMember) => {
    const confirmed = confirm(
      `Remove ${member.name}'s staff access? They will be demoted to a regular user and logged out immediately.`
    );
    if (!confirmed) return;
    setActing(member.id);
    try {
      await http.delete(`/admin/staff/${member.id}/revoke`);
      toast.success(`${member.name}'s staff access has been revoked`);
      fetchStaff();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to revoke access'));
    } finally {
      setActing(null);
    }
  };

  const handleCancelInvite = async (invite: PendingInvite) => {
    const confirmed = confirm(`Cancel the invite sent to ${invite.email}?`);
    if (!confirmed) return;
    setActing(invite.id);
    try {
      await http.delete(`/admin/staff/invites/${invite.id}`);
      toast.success('Invite cancelled');
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to cancel invite'));
    } finally {
      setActing(null);
    }
  };

  const inputStyle = {
    border: '1px solid var(--admin-border)',
    backgroundColor: 'var(--admin-surface)',
    color: 'var(--admin-text)',
  };

  const row = 'grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>
            Staff Management
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
            {staff.length} staff member{staff.length !== 1 ? 's' : ''}
            {invites.length > 0 &&
              ` · ${invites.length} pending invite${invites.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-9 px-4 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#1e40af', color: '#ffffff' }}
        >
          + Invite staff member
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center justify-between gap-3 text-sm rounded-xl px-4 py-3"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
        >
          <span>{error}</span>
          <button
            onClick={fetchStaff}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ backgroundColor: '#fecaca', color: '#7f1d1d' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Current Staff Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          boxShadow: 'var(--admin-card-shadow)',
        }}
      >
        <div
          className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--admin-soft)',
            color: 'var(--admin-muted)',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          Current staff
        </div>

        <div
          className={`${row} text-xs font-bold uppercase tracking-wider`}
          style={{
            backgroundColor: 'var(--admin-soft)',
            color: 'var(--admin-muted)',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          <div className="col-span-4">Member</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Joined</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-0">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 mx-4 my-2 rounded-xl animate-pulse"
                style={{ backgroundColor: 'var(--admin-soft)' }}
              />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>
            No staff members found.
          </div>
        ) : (
          staff.map((member, i) => (
            <div
              key={member.id}
              className={row}
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--admin-border)' }}
            >
              {/* Member info */}
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{
                    background:
                      member.role === 'ADMIN'
                        ? 'linear-gradient(135deg,#dc2626,#991b1b)'
                        : 'linear-gradient(135deg,#d97706,#92400e)',
                  }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--admin-text)' }}
                  >
                    {member.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>
                    {member.email}
                  </p>
                </div>
              </div>

              {/* Role badge */}
              <div className="col-span-3">
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-lg"
                  style={ROLE_STYLE[member.role]}
                >
                  {member.role === 'ADMIN' ? 'Administrator' : 'Moderator'}
                </span>
              </div>

              {/* Active status */}
              <div className="col-span-2">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={
                    member.isActive
                      ? { backgroundColor: '#dcfce7', color: '#166534' }
                      : { backgroundColor: '#fee2e2', color: '#991b1b' }
                  }
                >
                  {member.isActive ? 'Active' : 'Blocked'}
                </span>
              </div>

              {/* Joined date */}
              <div className="col-span-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
                {fmt(member.createdAt)}
              </div>

              {/* Revoke button */}
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => handleRevoke(member)}
                  disabled={acting === member.id}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                >
                  {acting === member.id ? '...' : 'Revoke'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending Invites Table */}
      {!loading && invites.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            boxShadow: 'var(--admin-card-shadow)',
          }}
        >
          <div
            className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: 'var(--admin-soft)',
              color: 'var(--admin-muted)',
              borderBottom: '1px solid var(--admin-border)',
            }}
          >
            Pending invites
          </div>

          <div
            className={`${row} text-xs font-bold uppercase tracking-wider`}
            style={{
              backgroundColor: 'var(--admin-soft)',
              color: 'var(--admin-muted)',
              borderBottom: '1px solid var(--admin-border)',
            }}
          >
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Invited by</div>
            <div className="col-span-2">Expires</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {invites.map((invite, i) => (
            <div
              key={invite.id}
              className={row}
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--admin-border)' }}
            >
              <div className="col-span-4 text-sm truncate" style={{ color: 'var(--admin-text)' }}>
                {invite.email}
              </div>

              <div className="col-span-2">
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-lg"
                  style={ROLE_STYLE[invite.role]}
                >
                  {invite.role === 'ADMIN' ? 'Administrator' : 'Moderator'}
                </span>
              </div>

              <div className="col-span-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
                {invite.invitedBy.name}
              </div>

              <div
                className="col-span-2 text-xs"
                style={{
                  color: isExpiringSoon(invite.expiresAt) ? '#dc2626' : 'var(--admin-muted)',
                }}
              >
                {isExpiringSoon(invite.expiresAt) ? '⚠ ' : ''}
                {fmt(invite.expiresAt)}
              </div>

              <div className="col-span-2 flex justify-center">
                <button
                  onClick={() => handleCancelInvite(invite)}
                  disabled={acting === invite.id}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                >
                  {acting === invite.id ? '...' : 'Cancel'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
            style={{
              backgroundColor: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>
                Invite staff member
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-sm px-2 py-1 rounded-lg"
                style={{ color: 'var(--admin-muted)' }}
              >
                ✕
              </button>
            </div>

            <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
              They&apos;ll receive an email with a link to set up their account. The invite expires
              in 48 hours.
            </p>

            <div className="flex flex-col gap-1">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--admin-muted)' }}
              >
                Email address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInvite();
                }}
                placeholder="colleague@example.com"
                className="h-10 rounded-xl px-3 text-sm outline-none"
                style={inputStyle}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--admin-muted)' }}
              >
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                className="h-10 rounded-xl px-3 text-sm outline-none"
                style={inputStyle}
              >
                <option value="MODERATOR">Moderator — can review and approve content</option>
                <option value="ADMIN">Administrator — full access</option>
              </select>
            </div>

            {/* Role description */}
            <div
              className="rounded-xl px-3 py-2 text-xs"
              style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-muted)' }}
            >
              {inviteRole === 'MODERATOR'
                ? 'Moderators can approve or reject resource submissions and view the admin dashboard.'
                : 'Administrators have full access including user management, staff invites, and system settings.'}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-10 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'var(--admin-soft)', color: 'var(--admin-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="flex-1 h-10 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#1e40af', color: '#ffffff' }}
              >
                {inviting ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
