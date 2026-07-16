// src/components/settings/sections/ProfileSection.tsx
'use client';
import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(300, 'Bio must be under 300 characters').optional(),
  website: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  country: z.string().optional(),
  preferredLanguage: z.string().optional(),
});
type ProfileData = z.infer<typeof profileSchema>;

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'si', label: 'Sinhala' },
  { value: 'ta', label: 'Tamil' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
];

const COUNTRIES = [
  'Sri Lanka',
  'India',
  'United Kingdom',
  'United States',
  'Australia',
  'Canada',
  'Germany',
  'France',
  'Japan',
  'Singapore',
  'Other',
];

const ROLE_COLOURS: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: '#fee2e2', text: '#991b1b' },
  MODERATOR: { bg: '#fef3c7', text: '#92400e' },
  USER: { bg: '#eff6ff', text: '#1e40af' },
};

const inputClass =
  'w-full h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all';
const inputStyle = {
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
};

export function ProfileSection() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      website: user?.website || '',
      country: user?.country || '',
      preferredLanguage: user?.preferredLanguage || 'en',
    },
  });

  const onSubmit = async (data: ProfileData) => {
    try {
      const updated = await api.users.updateProfile(data as Record<string, string>);
      setUser({ ...user!, ...updated });
      toast.success('Profile updated');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Failed to update profile')
          : 'Failed to update profile';
      toast.error(message);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const updated = await api.users.uploadAvatar(file);
      setUser({ ...user!, avatarUrl: updated.avatarUrl });
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const updated = await api.users.updateProfile({ avatarUrl: '' });
      setUser({ ...user!, avatarUrl: updated.avatarUrl });
      setPreview(null);
      toast.success('Profile photo removed');
    } catch {
      toast.error('Failed to remove photo');
    }
  };

  if (!user) return null;
  const roleColour = ROLE_COLOURS[user.role] || ROLE_COLOURS.USER;
  const displayAvatar = preview || user.avatarUrl;

  return (
    <div className="flex flex-col gap-8">
      {/* Account info banner */}
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.4)' }}
      >
        <div className="flex items-center gap-2">
          {user.isEmailVerified ? (
            <CheckCircle size={15} style={{ color: 'hsl(142 71% 45%)' }} />
          ) : (
            <AlertTriangle size={15} style={{ color: 'hsl(38 92% 50%)' }} />
          )}
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {user.isEmailVerified ? 'Email verified' : 'Email not verified'} · {user.email}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: roleColour.bg, color: roleColour.text }}
        >
          {user.role}
        </span>
      </div>

      {/* Avatar */}
      <div>
        <p className="text-sm font-semibold mb-4">Profile photo</p>
        <div className="flex items-center gap-5">
          <div
            className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden"
            style={{ background: '#2563eb' }}
          >
            {displayAvatar ? (
              <Image
                src={displayAvatar}
                alt="Avatar"
                width={80}
                height={80}
                className="h-20 w-20 object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
              style={{
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              <Trash2 size={14} /> Remove
            </button>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              JPG, PNG or WebP · Max 5 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Full name <span className="text-red-500">*</span>
          </label>
          <input {...register('name')} className={inputClass} style={inputStyle} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Bio</label>
          <textarea
            {...register('bio')}
            rows={3}
            placeholder="Tell others a bit about yourself…"
            className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={inputStyle}
          />
          {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Website</label>
          <input
            {...register('website')}
            type="url"
            placeholder="https://yourwebsite.com"
            className={inputClass}
            style={inputStyle}
          />
          {errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Country</label>
            <select {...register('country')} className={inputClass} style={inputStyle}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Preferred language</label>
            <select {...register('preferredLanguage')} className={inputClass} style={inputStyle}>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!isDirty}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
