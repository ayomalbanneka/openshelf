import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { http } from '@/lib/api'

interface Subscription {
  tier: 'SUPPORTER' | 'PATRON'
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MODERATOR' | 'USER'
  avatarUrl?: string
  isEmailVerified: boolean
  oauthProvider?: 'GOOGLE' | 'GITHUB'
  subscription?: Subscription
  notificationPrefs?: Record<string, boolean>
}

interface AuthState {
  user: User | null
  isLoading: boolean
  hasHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  setUser: (user: User) => void
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      hasHydrated: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          // Server sets httpOnly cookies — we just store the user object
          const { data } = await http.post('/auth/login', { email, password })
          set({ user: data.user })
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await http.post('/auth/register', { name, email, password })
          set({ user: data.user })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        try {
          // Server clears the httpOnly cookies
          await http.post('/auth/logout', {})
        } catch {
          // Always clear local state even if server call fails
        } finally {
          set({ user: null })
        }
      },

      fetchMe: async () => {
        try {
          const { data } = await http.get('/auth/me')
          set({ user: data.user })
        } catch {
          set({ user: null })
        }
      },

      setUser: (user) => set({ user }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'auth',
      partialize: (s) => ({ user: s.user }),  // only persist user object, not tokens
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)