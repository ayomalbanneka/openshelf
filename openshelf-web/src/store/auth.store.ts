import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { http } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MODERATOR' | 'USER'
  avatarUrl?: string
  isEmailVerified: boolean
}

interface AuthState {
  user:      User | null
  isLoading: boolean
  login:     (email: string, password: string) => Promise<void>
  register:  (name: string, email: string, password: string) => Promise<void>
  logout:    () => Promise<void>
  fetchMe:   () => Promise<void>
  setUser:   (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:      null,
      isLoading: false,

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
    }),
    {
      name:       'auth',
      partialize: (s) => ({ user: s.user }),  // only persist user object, not tokens
    }
  )
)