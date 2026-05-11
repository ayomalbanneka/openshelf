'use client'
import { useState, useRef } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, AlertTriangle, Trash2 } from 'lucide-react'

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    bio: z.string().max(300, 'Bio must be under 300 characters').optional(),
    website: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
    country: z.string().optional(),
    preferredLanguage: z.string().optional(),
})

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
})

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'si', label: 'Sinhala' },
    { value: 'ta', label: 'Tamil' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'es', label: 'Spanish' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' },
]

const COUNTRIES = [
    'Sri Lanka', 'India', 'United Kingdom', 'United States',
    'Australia', 'Canada', 'Germany', 'France',
    'Japan', 'Singapore', 'Other',
]

const ROLE_COLOURS: Record<string, { bg: string; text: string }> = {
    ADMIN: { bg: '#fee2e2', text: '#991b1b' },
    MODERATOR: { bg: '#fef3c7', text: '#92400e' },
    USER: { bg: '#eff6ff', text: '#1e40af' },
}

const inputClass = 'w-full h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all'
const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div
            className="pb-4 mb-6"
            style={{ borderBottom: '1px solid hsl(var(--border))' }}
        >
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && (
                <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {subtitle}
                </p>
            )}
        </div>
    )
}

export function SettingsForm() {
    const { user, setUser } = useAuthStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [avatarUploading, setAvatarUploading] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    // ── Profile form ──────────────────────────────────────────
    const {
        register: regProfile,
        handleSubmit: handleProfile,
        formState: { errors: profileErrors, isDirty: profileDirty },
    } = useForm<ProfileData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            bio: (user as any)?.bio || '',
            website: (user as any)?.website || '',
            country: (user as any)?.country || '',
            preferredLanguage: (user as any)?.preferredLanguage || 'en',
        },
    })

    const onProfileSubmit = async (data: ProfileData) => {
        try {
            const updated = await api.users.updateProfile(data as Record<string, string>)
            setUser({ ...user!, ...updated })
            toast.success('Profile updated')
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to update profile')
        }
    }

    // ── Password form ─────────────────────────────────────────
    const {
        register: regPwd,
        handleSubmit: handlePwd,
        reset: resetPwd,
        formState: { errors: pwdErrors },
    } = useForm<PasswordData>({
        resolver: zodResolver(passwordSchema),
    })

    const onPasswordSubmit = async (data: PasswordData) => {
        try {
            await api.users.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            })
            toast.success('Password changed successfully')
            resetPwd()
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to change password')
        }
    }

    // ── Avatar upload ─────────────────────────────────────────
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Avatar must be under 5 MB')
            return
        }

        // Show preview immediately
        const reader = new FileReader()
        reader.onload = () => setAvatarPreview(reader.result as string)
        reader.readAsDataURL(file)

        setAvatarUploading(true)
        try {
            const updated = await api.users.uploadAvatar(file)
            setUser({ ...user!, avatarUrl: updated.avatarUrl })
            toast.success('Avatar updated')
        } catch {
            toast.error('Failed to upload avatar')
            setAvatarPreview(null)
        } finally {
            setAvatarUploading(false)
        }
    }

    const handleRemoveAvatar = async () => {
        if (!user) return
        try {
            const updated = await api.users.updateProfile({ avatarUrl: '' })
            setUser({ ...user, avatarUrl: updated.avatarUrl })
            setAvatarPreview(null)
            toast.success('Profile photo removed')
        } catch {
            toast.error('Failed to remove profile photo')
        }
    }

    if (!user) return null

    const roleColour = ROLE_COLOURS[user.role] || ROLE_COLOURS.USER
    const displayAvatar = avatarPreview || user.avatarUrl

    return (
        <div className="flex flex-col gap-10">

            {/* ── Account info banner ───────────────────────────── */}
            <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--muted) / 0.4)',
                }}
            >
                <div className="flex items-center gap-3">
                    <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p
                            className="text-xs mt-0.5 inline-flex items-center gap-1.5"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            {user.isEmailVerified ? (
                                <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--success))' }} />
                            ) : (
                                <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--ring))' }} />
                            )}
                            {user.isEmailVerified ? 'Email verified' : 'Email not verified'}
                        </p>
                    </div>
                </div>
                <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: roleColour.bg, color: roleColour.text }}
                >
                    {user.role}
                </span>
            </div>

            {/* ── Avatar ───────────────────────────────────────── */}
            <section>
                <SectionHeader
                    title="Profile photo"
                    subtitle="Upload a photo to personalise your profile."
                />
                <div className="flex items-center gap-6">
                    {/* Avatar preview */}
                    <div
                        className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden"
                        style={{ backgroundColor: '#2563eb' }}
                    >
                        {displayAvatar ? (
                            <img
                                src={displayAvatar}
                                alt="Avatar"
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
                            disabled={avatarUploading}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            style={{
                                border: '1px solid hsl(var(--border))',
                                color: 'hsl(var(--foreground))',
                            }}
                        >
                            {avatarUploading ? 'Uploading…' : 'Change photo'}
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
                            <Trash2 className="h-4 w-4" />
                            Remove photo
                        </button>
                        <p
                            className="text-xs"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
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
            </section>

            {/* ── Profile info ─────────────────────────────────── */}
            <section>
                <SectionHeader
                    title="Profile information"
                    subtitle="This is visible to other users on your public profile."
                />
                <form
                    onSubmit={handleProfile(onProfileSubmit)}
                    className="flex flex-col gap-4"
                >
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                            Full name <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...regProfile('name')}
                            className={inputClass}
                            style={inputStyle}
                        />
                        {profileErrors.name && (
                            <p className="text-xs text-red-500">{profileErrors.name.message}</p>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Bio</label>
                        <textarea
                            {...regProfile('bio')}
                            rows={3}
                            placeholder="Tell others a bit about yourself…"
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 transition-all"
                            style={inputStyle}
                        />
                        {profileErrors.bio && (
                            <p className="text-xs text-red-500">{profileErrors.bio.message}</p>
                        )}
                    </div>

                    {/* Website */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Website</label>
                        <input
                            {...regProfile('website')}
                            type="url"
                            placeholder="https://yourwebsite.com"
                            className={inputClass}
                            style={inputStyle}
                        />
                        {profileErrors.website && (
                            <p className="text-xs text-red-500">{profileErrors.website.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Country */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium">Country</label>
                            <select
                                {...regProfile('country')}
                                className={inputClass}
                                style={inputStyle}
                            >
                                <option value="">Select country</option>
                                {COUNTRIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Language */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium">Preferred language</label>
                            <select
                                {...regProfile('preferredLanguage')}
                                className={inputClass}
                                style={inputStyle}
                            >
                                {LANGUAGES.map((l) => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={!profileDirty}
                            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            Save changes
                        </button>
                    </div>
                </form>
            </section>

            {/* ── Change password ───────────────────────────────── */}
            <section>
                <SectionHeader
                    title="Change password"
                    subtitle="Use a strong password you don't use anywhere else."
                />
                <form
                    onSubmit={handlePwd(onPasswordSubmit)}
                    className="flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Current password</label>
                        <input
                            {...regPwd('currentPassword')}
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className={inputClass}
                            style={inputStyle}
                        />
                        {pwdErrors.currentPassword && (
                            <p className="text-xs text-red-500">
                                {pwdErrors.currentPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">New password</label>
                        <input
                            {...regPwd('newPassword')}
                            type="password"
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            className={inputClass}
                            style={inputStyle}
                        />
                        {pwdErrors.newPassword && (
                            <p className="text-xs text-red-500">
                                {pwdErrors.newPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Confirm new password</label>
                        <input
                            {...regPwd('confirmPassword')}
                            type="password"
                            placeholder="Repeat new password"
                            autoComplete="new-password"
                            className={inputClass}
                            style={inputStyle}
                        />
                        {pwdErrors.confirmPassword && (
                            <p className="text-xs text-red-500">
                                {pwdErrors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Change password
                        </button>
                    </div>
                </form>
            </section>

            {/* ── Danger zone ───────────────────────────────────── */}
            <section>
                <SectionHeader
                    title="Account"
                    subtitle="Manage your account status."
                />
                <div
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                        border: '1px solid #fca5a5',
                        backgroundColor: '#fef2f2',
                    }}
                >
                    <div>
                        <p className="text-sm font-semibold text-red-800">Delete account</p>
                        <p className="text-xs text-red-700 mt-0.5">
                            Contact support to permanently delete your account and all your data.
                        </p>
                    </div>

                    <a href="mailto:support@openshelf.dev"
                        className="px-4 py-2 rounded-lg text-sm font-medium text-red-700 shrink-0 transition-colors hover:bg-red-100"
                        style={{ border: '1px solid #fca5a5' }}
                    >
                        Contact support
                    </a>
                </div>
            </section>

        </div>
    )
}