// src/components/settings/sections/SecuritySection.tsx
'use client';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type PasswordData = z.infer<typeof passwordSchema>;

const inputClass =
  'w-full h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all';
const inputStyle = {
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
};

export function SecuritySection() {
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: PasswordData) => {
    try {
      await api.users.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      reset();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Failed to change password')
          : 'Failed to change password';
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Change password */}
      <div>
        <p className="text-sm font-semibold mb-4">Change password</p>
        {user?.oauthProvider && (
          <div
            className="text-sm p-4 rounded-xl mb-4"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
          >
            Your account uses {user.oauthProvider === 'GOOGLE' ? 'Google' : 'GitHub'} sign-in.
            Password change is not available for OAuth-only accounts.
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Current password</label>
            <input
              {...register('currentPassword')}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={!!user?.oauthProvider}
              className={inputClass}
              style={inputStyle}
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">New password</label>
            <input
              {...register('newPassword')}
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              disabled={!!user?.oauthProvider}
              className={inputClass}
              style={inputStyle}
            />
            {errors.newPassword && (
              <p className="text-xs text-red-500">{errors.newPassword.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Confirm new password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Repeat new password"
              autoComplete="new-password"
              disabled={!!user?.oauthProvider}
              className={inputClass}
              style={inputStyle}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!!user?.oauthProvider}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Change password
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div>
        <p className="text-sm font-semibold mb-4">Danger zone</p>
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ border: '1px solid #fca5a5', background: '#fef2f2' }}
        >
          <div>
            <p className="text-sm font-semibold text-red-800">Delete account</p>
            <p className="text-xs text-red-700 mt-0.5">
              Permanently deletes your account and all your data.
            </p>
          </div>

          <a
            href="mailto:support@openshelf.dev"
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-700 shrink-0 hover:bg-red-100 transition-colors"
            style={{ border: '1px solid #fca5a5' }}
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
