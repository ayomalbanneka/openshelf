'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { ResourceCard } from '@/components/resource/ResourceCard'
import Link from 'next/link'
import type { Resource } from '@/types'

interface UserData {
    id: string
    name: string
    bio?: string
    avatarUrl?: string
    website?: string
    country?: string
    createdAt: string
    _count: { uploads: number; followers: number; following: number }
}

interface Props {
    user: UserData
    uploads: Resource[]
}

export function UserProfile({ user, uploads }: Props) {
    const { user: currentUser } = useAuthStore()
    const isMe = currentUser?.id === user.id

    const [following, setFollowing] = useState(false)
    const [fLoading, setFLoading] = useState(false)
    const [followerCount, setFollowerCount] = useState(user._count.followers)
    const [activeTab, setActiveTab] = useState<'uploads' | 'about'>('uploads')

    // Check if we're already following this user
    useEffect(() => {
        if (!currentUser || isMe) return
        api.users.isFollowing(user.id)
            .then((data) => setFollowing(data.isFollowing))
            .catch(() => { })
    }, [currentUser, user.id, isMe])

    const handleFollow = async () => {
        if (!currentUser) return
        setFLoading(true)
        try {
            if (following) {
                await api.users.unfollow(user.id)
                setFollowing(false)
                setFollowerCount((c) => c - 1)
            } else {
                await api.users.follow(user.id)
                setFollowing(true)
                setFollowerCount((c) => c + 1)
            }
        } catch {
            // silently fail
        } finally {
            setFLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">

            {/* ── Profile header ────────────────────────────── */}
            <div
                className="rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start gap-6"
                style={{
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                }}
            >
                {/* Avatar */}
                <div
                    className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
                    style={{ backgroundColor: '#2563eb' }}
                >
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-20 w-20 rounded-2xl object-cover"
                        />
                    ) : (
                        user.name.charAt(0).toUpperCase()
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">{user.name}</h1>
                            {user.country && (
                                <p
                                    className="text-sm mt-0.5"
                                    style={{ color: 'hsl(var(--muted-foreground))' }}
                                >
                                    {user.country}
                                </p>
                            )}
                        </div>

                        {/* Follow / Edit button */}
                        {!isMe && currentUser && (
                            <button
                                onClick={handleFollow}
                                disabled={fLoading}
                                className="px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                                style={
                                    following
                                        ? {
                                            border: '1px solid hsl(var(--border))',
                                            color: 'hsl(var(--foreground))',
                                        }
                                        : {
                                            backgroundColor: '#2563eb',
                                            color: '#fff',
                                        }
                                }
                            >
                                {fLoading ? '…' : following ? 'Unfollow' : 'Follow'}
                            </button>
                        )}

                        {isMe && (
                            <Link
                                href="/settings"
                                className="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                                style={{
                                    border: '1px solid hsl(var(--border))',
                                    color: 'hsl(var(--foreground))',
                                }}
                            >
                                Edit profile
                            </Link>
                        )}

                        {!currentUser && (
                            <Link
                                href="/login"
                                className="px-5 py-2 rounded-xl text-sm font-medium text-white"
                                style={{ backgroundColor: '#2563eb' }}
                            >
                                Sign in to follow
                            </Link>
                        )}
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <p
                            className="mt-3 text-sm leading-relaxed"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            {user.bio}
                        </p>
                    )}

                    {/* Website */}
                    {user.website && (

                        <a href={user.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                        >
                            {user.website.replace(/^https?:\/\//, '')}
                        </a>
                    )}

                    {/* Stats row */}
                    <div className="flex gap-6 mt-4">
                        <Stat label="uploads" value={user._count.uploads} />
                        <Stat label="followers" value={followerCount} />
                        <Stat label="following" value={user._count.following} />
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────── */}
            <div
                className="flex gap-1 mb-6 border-b"
                style={{ borderColor: 'hsl(var(--border))' }}
            >
                {(['uploads', 'about'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px"
                        style={{
                            borderColor: activeTab === tab ? '#2563eb' : 'transparent',
                            color:
                                activeTab === tab
                                    ? '#2563eb'
                                    : 'hsl(var(--muted-foreground))',
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── Uploads tab ───────────────────────────────── */}
            {activeTab === 'uploads' && (
                <>
                    {uploads.length === 0 ? (
                        <p
                            className="text-sm text-center py-12"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            {isMe ? "You haven't uploaded anything yet." : 'No uploads yet.'}
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {uploads.map((resource) => (
                                <ResourceCard key={resource.id} resource={resource} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── About tab ─────────────────────────────────── */}
            {activeTab === 'about' && (
                <div
                    className="rounded-xl p-6 text-sm space-y-3"
                    style={{
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--background))',
                    }}
                >
                    {user.bio && (
                        <div>
                            <p className="font-medium mb-1">Bio</p>
                            <p style={{ color: 'hsl(var(--muted-foreground))' }}>{user.bio}</p>
                        </div>
                    )}
                    {user.country && (
                        <div>
                            <p className="font-medium mb-1">Country</p>
                            <p style={{ color: 'hsl(var(--muted-foreground))' }}>{user.country}</p>
                        </div>
                    )}
                    {user.website && (
                        <div>
                            <p className="font-medium mb-1">Website</p>

                            <a href={user.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                {user.website}
                            </a>
                        </div>
                    )}
                    <div>
                        <p className="font-medium mb-1">Member since</p>
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long',
                            })}
                        </p>
                    </div>
                </div>
            )}

        </div>
    )
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="text-sm">
            <span className="font-bold">{value.toLocaleString()}</span>{' '}
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
        </div>
    )
}