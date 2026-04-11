import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const api = {
  users: {
    isFollowing: (id: string) =>
      http.get(`/users/${id}/is-following`).then((r) => r.data),
    follow: (id: string) =>
      http.post(`/users/${id}/follow`).then((r) => r.data),
    unfollow: (id: string) =>
      http.delete(`/users/${id}/follow`).then((r) => r.data),
    updateProfile: (data: Record<string, string>) =>
      http.patch('/users/me', data).then((r) => r.data),
  },
}

export const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

// Attach the access token to every outgoing request
http.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// If a request returns 401, try refreshing the token automatically
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        })

        localStorage.setItem('accessToken', data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return http(original)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)