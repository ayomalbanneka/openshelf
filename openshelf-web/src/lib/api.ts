import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

export const api = {
  // Users endpoints for following/unfollowing and profile updates
  users: {
    isFollowing: (id: string) =>
      http.get(`/users/${id}/is-following`).then((r) => r.data),
    follow: (id: string) =>
      http.post(`/users/${id}/follow`).then((r) => r.data),
    unfollow: (id: string) =>
      http.delete(`/users/${id}/follow`).then((r) => r.data),
    updateProfile: (data: Record<string, string>) =>
      http.patch('/users/me', data).then((r) => r.data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      http.patch('/users/me/password', data).then((r) => r.data),
    uploadAvatar: (file: File) => {
      const form = new FormData()
      form.append('avatar', file)
      return http.post('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data)
    },
  },

  // Lists endpoints for managing user-created lists and their items
  lists: {
    getMine: (page = 1, limit = 10) =>
      http.get(`/lists/mine?page=${page}&limit=${limit}`).then((r) => r.data),
    getOne: (id: string) =>
      http.get(`/lists/${id}`).then((r) => r.data),
    create: (data: { title: string; description?: string; isPublic?: boolean }) =>
      http.post('/lists', data).then((r) => r.data),
    update: (id: string, data: { title?: string; description?: string; isPublic?: boolean }) =>
      http.patch(`/lists/${id}`, data).then((r) => r.data),
    remove: (id: string) =>
      http.delete(`/lists/${id}`).then((r) => r.data),
    addItem: (id: string, resourceId: string, note?: string) =>
      http.post(`/lists/${id}/items`, { resourceId, note }).then((r) => r.data),
    removeItem: (id: string, itemId: string) =>
      http.delete(`/lists/${id}/items/${itemId}`).then((r) => r.data),
  },

  // Clubs endpoints for managing book clubs, discussions, and comments
  clubs: {
    list: (params?: { search?: string; page?: number }) =>
      http.get('/clubs', { params }).then((r) => r.data),
    getOne: (slug: string) =>
      http.get(`/clubs/${slug}`).then((r) => r.data),
    create: (data: { name: string; description?: string; isPublic?: boolean }) =>
      http.post('/clubs', data).then((r) => r.data),
    join: (slug: string) =>
      http.post(`/clubs/${slug}/join`).then((r) => r.data),
    leave: (slug: string) =>
      http.delete(`/clubs/${slug}/leave`).then((r) => r.data),
    getMembership: (slug: string) =>
      http.get(`/clubs/${slug}/membership`).then((r) => r.data),
    getDiscussions: (slug: string) =>
      http.get(`/clubs/${slug}/discussions`).then((r) => r.data),
    createDiscussion: (slug: string, data: { title: string; body: string; resourceId?: string }) =>
      http.post(`/clubs/${slug}/discussions`, data).then((r) => r.data),
    getComments: (slug: string, discussionId: string) =>
      http.get(`/clubs/${slug}/discussions/${discussionId}/comments`).then((r) => r.data),
    createComment: (slug: string, discussionId: string, body: string) =>
      http.post(`/clubs/${slug}/discussions/${discussionId}/comments`, { body }).then((r) => r.data),
  },

  // Reading progress endpoints for tracking and updating user progress on resources
  progress: {
    get: (resourceId: string) =>
      http.get(`/progress/${resourceId}`).then((r) => r.data),
    update: (resourceId: string, data: {
      currentPage?: number
      totalPages?: number
      currentTime?: number
      totalTime?: number
    }) =>
      http.put(`/progress/${resourceId}`, data).then((r) => r.data),
    getMine: () =>
      http.get('/progress/mine').then((r) => r.data),
    getCompleted: () =>
      http.get('/progress/completed').then((r) => r.data),
  },

  // Comments endpoints for managing comments on resources and club discussions
  comments: {
    getForResource: (slug: string) =>
      http.get(`/resources/${slug}/comments`).then((r) => r.data),
    create: (slug: string, body: string, parentId?: string) =>
      http.post(`/resources/${slug}/comments`, { body, parentId })
        .then((r) => r.data),
    update: (id: string, body: string) =>
      http.patch(`/comments/${id}`, { body }).then((r) => r.data),
    delete: (id: string) =>
      http.delete(`/comments/${id}`).then((r) => r.data),
  },
}


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

// If a request returns 401, try refreshing the token once
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Don't retry on auth endpoints or if already retried
    const isAuthEndpoint =
      typeof original?.url === 'string' &&
      (original.url.includes('/auth/login') ||
       original.url.includes('/auth/register') ||
       original.url.includes('/auth/refresh') ||
       original.url.includes('/auth/logout'))

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        // Use a plain axios call — not the http instance — to avoid interceptor loops
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })

        // Store the rotated token pair (server now returns both on refresh)
        localStorage.setItem('accessToken',  data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)

        // Retry the original request with the new access token
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return http(original)
      } catch {
        // Refresh failed — clear everything and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')

        // Redirect to the right login page based on current path
        const isAdminPath = window.location.pathname.startsWith('/admin')
        window.location.href = isAdminPath ? '/admin/login' : '/login'
      }
    }

    return Promise.reject(error)
  }
)