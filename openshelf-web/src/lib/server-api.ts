const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

/// A simple wrapper around fetch to handle query parameters and error handling
interface FetchOptions {
  params?: Record<string, string | number | undefined>
}

// Builds a URL with query parameters
const buildUrl = (path: string, params?: Record<string, string | number | undefined>) => {
  const url = new URL(`${BASE_URL}${path}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}



// A simple API client for the server endpoints
export const serverApi = {
  resources: { // List resources with optional query parameters for filtering, pagination, etc.
    list: async (params?: FetchOptions['params']) => {
      const url = buildUrl('/resources', params)
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch resources')
      return res.json()
    },

    getOne: async (slug: string) => {
      const res = await fetch(`${BASE_URL}/resources/${slug}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Resource not found')
      return res.json()
    },

    search: async (params?: FetchOptions['params']) => {
      const url = buildUrl('/resources/search', params)
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Search failed')
      return res.json()
    },

    categories: {
      list: async () => {
        const res = await fetch(`${BASE_URL}/categories`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch categories')
        return res.json()
      },
    },
  },

  categories: { // Fetch the list of categories
    list: async () => {
      const res = await fetch(`${BASE_URL}/categories`, {
        cache: 'no-store',
      })

      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    }
  },

  // Fetch the list of tags
  tags: {
    list: async () => {
      const res = await fetch(`${BASE_URL}/tags`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch tags')
      return res.json()
    },
  },

  users: { // Fetch user profile and uploads
    getProfile: async (id: string) => {
      const res = await fetch(`${BASE_URL}/users/${id}`, {
        cache: 'no-store',
      })

      if (!res.ok) throw new Error('User not found')
      return res.json()
    },

    getUploads: async (id: string) => {
      const res = await fetch(`${BASE_URL}/users/${id}/uploads`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Failed to fetch user uploads')
      return res.json()
    },
  },

  clubs: {// Fetch book clubs with optional search and pagination parameters
    list: async (params?: { search?: string; page?: number }) => {
      const url = buildUrl('/clubs', params)
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch clubs')
      return res.json()
    },
    getOne: async (slug: string) => {
      const res = await fetch(`${BASE_URL}/clubs/${slug}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Club not found')
      return res.json()
    },

    getDiscussion: async (slug: string, discussionId: string) => {
      const res = await fetch(`${BASE_URL}/clubs/${slug}/discussions/${discussionId}`, { cache: 'no-store' })

      if (!res.ok) throw new Error('Discussion not found')
      return res.json()
    },
  },

  admin: {
    getStats: async (token: string) => {
      const res = await fetch(`${BASE_URL}/admin/stats`, {
        cache:   'no-store',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Unauthorized')
      return res.json()
    },

    getPending: async (token: string, page = 1) => {
      const res = await fetch(`${BASE_URL}/admin/pending?page=${page}`, {
        cache:   'no-store',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Unauthorized')
      return res.json()
    },
  },
}