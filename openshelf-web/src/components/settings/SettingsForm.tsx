'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, AlertTriangle, Trash2, Loader2, Sparkles, Star, RefreshCw } from 'lucide-react'
import Link from 'next/link'

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
    ADMIN:     { bg: '#fee2e2', text: '#991b1b' },
    MODERATOR: { bg: '#fef3c7', text: '#92400e' },
    USER:      { bg: '#eff6ff', text: '#1e40af' },
}

const inputClass = 'w-full h-10 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all'
const inputStyle = {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="pb-4 mb-6" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && (
                <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {subtitle}
                </p>
            )}
        </div>
    )
}

// ── Subscription panel (settings-page variant) ────────────────────────────────
// Shows current status + Manage button if subscribed, or a CTA to /support if not.
// Auto-syncs with Stripe when the user returns from the billing portal so that
// cancellations, plan changes, and payment-method updates are reflected immediately.

function SubscriptionPanelInner() {
    const { user, fetchMe } = useAuthStore()
    const params            = useSearchParams()
    const [loading, setLoading]   = useState(false)
    const [syncing, setSyncing]   = useState(false)

    const sub      = user?.subscription
    const isActive = sub?.status === 'ACTIVE' || sub?.status === 'PAST_DUE'

    const statusColour: Record<string, string> = {
        ACTIVE:     'hsl(142 71% 45%)',
        PAST_DUE:   'hsl(38 92% 50%)',
        CANCELED:   'hsl(var(--muted-foreground))',
        INCOMPLETE: 'hsl(var(--muted-foreground))',
    }

    const handleSync = async ({ silent = false } = {}) => {
        setSyncing(true)
        try {
            await api.payments.sync()
            await fetchMe()
            if (!silent) toast.success('Subscription synced.')
        } catch {
            if (!silent) toast.error('Could not sync subscription. Please try again.')
        } finally {
            setSyncing(false)
        }
    }

    const handleManage = async () => {
        setLoading(true)
        try {
            const { url } = await api.payments.portal()
            // portal return_url is /settings?portal=return — auto-sync fires on return
            window.location.href = url
        } catch {
            toast.error('Could not open billing portal. Please try again.')
            setLoading(false)
        }
    }

    useEffect(() => {
        const fromPortal   = params.get('portal') === 'return'
        const fromCheckout = params.get('checkout') === 'success'

        if (fromPortal || fromCheckout) {
            // Explicitly returning from Stripe — sync immediately.
            handleSync({ silent: true })
        } else if (sub?.status === 'ACTIVE' || sub?.status === 'PAST_DUE') {
            // Always sync on mount when the subscription is active. This covers
            // the case where the user closes the portal tab or navigates back
            // manually without hitting the return_url, so ?portal=return is absent
            // but the subscription state may still have changed on Stripe's side.
            handleSync({ silent: true })
        } else {
            // No active subscription — just read from our own DB.
            fetchMe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!isActive) {
        return (
            <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
            >
                <div>
                    <p className="text-sm font-medium">No active subscription</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Support OpenShelf to unlock perks and keep the project running.
                    </p>
                </div>
                <Link
                    href="/support"
                    className="px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-all"
                    style={{
                        background: 'hsl(var(--primary))',
                        color:      'hsl(var(--primary-foreground))',
                    }}
                >
                    View plans
                </Link>
            </div>
        )
    }

    const renewDate = sub?.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, {
              year: 'numeric', month: 'long', day: 'numeric',
          })
        : null

    return (
        <div
            className="flex flex-col gap-4 p-4 rounded-xl"
            style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    {sub!.tier === 'PATRON'
                        ? <Sparkles size={15} style={{ color: 'hsl(var(--primary))' }} />
                        : <Star     size={15} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    }
                    <span className="text-sm font-semibold">
                        {sub!.tier === 'PATRON' ? 'Patron' : 'Supporter'}
                    </span>
                    <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                            background: sub!.cancelAtPeriodEnd
                                ? 'hsl(38 92% 50% / 0.12)'
                                : `${statusColour[sub!.status]}22`,
                            color: sub!.cancelAtPeriodEnd
                                ? 'hsl(38 92% 40%)'
                                : statusColour[sub!.status],
                        }}
                    >
                        {sub!.cancelAtPeriodEnd
                            ? 'Cancels soon'
                            : sub!.status === 'PAST_DUE'
                                ? 'Past due'
                                : sub!.status.charAt(0) + sub!.status.slice(1).toLowerCase()}
                    </span>
                </div>

                {/* Manual sync — lets the user pull latest state from Stripe */}
                <button
                    onClick={() => handleSync()}
                    disabled={syncing}
                    title="Sync with Stripe"
                    className="flex shrink-0 items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                    style={{
                        color:      'hsl(var(--muted-foreground))',
                        border:     '1px solid hsl(var(--border))',
                        background: 'transparent',
                        opacity:    syncing ? 0.5 : 1,
                        cursor:     syncing ? 'not-allowed' : 'pointer',
                    }}
                >
                    <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
                    Sync with Stripe
                </button>
            </div>

            {renewDate && (
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {sub!.cancelAtPeriodEnd
                        ? `Access ends on ${renewDate}. No further charges.`
                        : `Renews on ${renewDate}`}
                </p>
            )}

            {sub!.status === 'PAST_DUE' && (
                <p className="text-sm" style={{ color: 'hsl(38 92% 50%)' }}>
                    Your last payment failed. Update your payment method to keep your benefits.
                </p>
            )}

            {sub!.cancelAtPeriodEnd && (
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Your subscription is scheduled to cancel. You can reactivate it any time before the end date.
                </p>
            )}

            <button
                onClick={handleManage}
                disabled={loading}
                className="h-10 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{
                    background: 'transparent',
                    border:     '1px solid hsl(var(--border))',
                    color:      'hsl(var(--foreground))',
                    opacity:    loading ? 0.6 : 1,
                    cursor:     loading ? 'not-allowed' : 'pointer',
                }}
            >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Manage subscription
            </button>
        </div>
    )
}

function SubscriptionPanel() {
    return (
        <Suspense>
            <SubscriptionPanelInner />
        </Suspense>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function SettingsForm() {
    const { user, setUser } = useAuthStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [avatarUploading, setAvatarUploading] = useState(false)
    const [avatarPreview, setAvatarPreview]     = useState<string | null>(null)

    const {
        register: regProfile,
        handleSubmit: handleProfile,
        formState: { errors: profileErrors, isDirty: profileDirty },
    } = useForm<ProfileData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name:              user?.name || '',
            bio:               (user as any)?.bio || '',
            website:           (user as any)?.website || '',
            country:           (user as any)?.country || '',
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
                newPassword:     data.newPassword,
            })
            toast.success('Password changed successfully')
            resetPwd()
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to change password')
        }
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { toast.error('Avatar must be under 5 MB'); return }

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

    const roleColour  = ROLE_COLOURS[user.role] || ROLE_COLOURS.USER
    const displayAvatar = avatarPreview || user.avatarUrl

    return (
        <div className="flex flex-col gap-10">

            {/* ── Account info banner ───────────────────────────── */}
            <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.4)' }}
            >
                <div className="flex items-center gap-3">
                    <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs mt-0.5 inline-flex items-center gap-1.5"
                            style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {user.isEmailVerified
                                ? <CheckCircle  className="h-3.5 w-3.5" style={{ color: 'hsl(var(--success))' }} />
                                : <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--ring))' }} />}
                            {user.isEmailVerified ? 'Email verified' : 'Email not verified'}
                        </p>
                    </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: roleColour.bg, color: roleColour.text }}>
                    {user.role}
                </span>
            </div>

            {/* ── Avatar ───────────────────────────────────────── */}
            <section>
                <SectionHeader title="Profile photo" subtitle="Upload a photo to personalise your profile." />
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden"
                        style={{ backgroundColor: '#2563eb' }}>
                        {displayAvatar
                            ? <img src={displayAvatar} alt="Avatar" className="h-20 w-20 object-cover" />
                            : user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            disabled={avatarUploading}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                            {avatarUploading ? 'Uploading…' : 'Change photo'}
                        </button>
                        <button type="button" onClick={handleRemoveAvatar}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                            <Trash2 className="h-4 w-4" /> Remove photo
                        </button>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            JPG, PNG or WebP · Max 5 MB
                        </p>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                            onChange={handleAvatarChange} className="hidden" />
                    </div>
                </div>
            </section>

            {/* ── Profile info ─────────────────────────────────── */}
            <section>
                <SectionHeader title="Profile information"
                    subtitle="This is visible to other users on your public profile." />
                <form onSubmit={handleProfile(onProfileSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Full name <span className="text-red-500">*</span></label>
                        <input {...regProfile('name')} className={inputClass} style={inputStyle} />
                        {profileErrors.name && <p className="text-xs text-red-500">{profileErrors.name.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Bio</label>
                        <textarea {...regProfile('bio')} rows={3} placeholder="Tell others a bit about yourself…"
                            className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 transition-all"
                            style={inputStyle} />
                        {profileErrors.bio && <p className="text-xs text-red-500">{profileErrors.bio.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Website</label>
                        <input {...regProfile('website')} type="url" placeholder="https://yourwebsite.com"
                            className={inputClass} style={inputStyle} />
                        {profileErrors.website && <p className="text-xs text-red-500">{profileErrors.website.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium">Country</label>
                            <select {...regProfile('country')} className={inputClass} style={inputStyle}>
                                <option value="">Select country</option>
                                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium">Preferred language</label>
                            <select {...regProfile('preferredLanguage')} className={inputClass} style={inputStyle}>
                                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={!profileDirty}
                            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                            Save changes
                        </button>
                    </div>
                </form>
            </section>

            {/* ── Change password ───────────────────────────────── */}
            <section>
                <SectionHeader title="Change password"
                    subtitle="Use a strong password you don't use anywhere else." />
                <form onSubmit={handlePwd(onPasswordSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Current password</label>
                        <input {...regPwd('currentPassword')} type="password" placeholder="••••••••"
                            autoComplete="current-password" className={inputClass} style={inputStyle} />
                        {pwdErrors.currentPassword && <p className="text-xs text-red-500">{pwdErrors.currentPassword.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">New password</label>
                        <input {...regPwd('newPassword')} type="password" placeholder="At least 8 characters"
                            autoComplete="new-password" className={inputClass} style={inputStyle} />
                        {pwdErrors.newPassword && <p className="text-xs text-red-500">{pwdErrors.newPassword.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Confirm new password</label>
                        <input {...regPwd('confirmPassword')} type="password" placeholder="Repeat new password"
                            autoComplete="new-password" className={inputClass} style={inputStyle} />
                        {pwdErrors.confirmPassword && <p className="text-xs text-red-500">{pwdErrors.confirmPassword.message}</p>}
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit"
                            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                            Change password
                        </button>
                    </div>
                </form>
            </section>

            {/* ── Subscription ──────────────────────────────────── */}
            <section>
                <SectionHeader title="Subscription"
                    subtitle="Manage your current support tier." />
                <SubscriptionPanel />
            </section>

            {/* ── Danger zone ───────────────────────────────────── */}
            <section>
                <SectionHeader title="Account" subtitle="Manage your account status." />
                <div className="flex items-center justify-between p-4 rounded-xl"
                    style={{ border: '1px solid #fca5a5', backgroundColor: '#fef2f2' }}>
                    <div>
                        <p className="text-sm font-semibold text-red-800">Delete account</p>
                        <p className="text-xs text-red-700 mt-0.5">
                            Contact support to permanently delete your account and all your data.
                        </p>
                    </div>
                    <a href="mailto:support@openshelf.dev"
                        className="px-4 py-2 rounded-lg text-sm font-medium text-red-700 shrink-0 transition-colors hover:bg-red-100"
                        style={{ border: '1px solid #fca5a5' }}>
                        Contact support
                    </a>
                </div>
            </section>

        </div>
    )
}