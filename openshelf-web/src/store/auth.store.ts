import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { http } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MODERATOR' | 'USER'
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await http.post('/auth/login', { email, password })
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          set({ user: data.user })
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await http.post('/auth/register', { name, email, password })
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          set({ user: data.user })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null })
      },

      fetchMe: async () => {
        try {
          const { data } = await http.get('/auth/me')
          set({ user: data.user })
        } catch {
          set({ user: null })
        }
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)