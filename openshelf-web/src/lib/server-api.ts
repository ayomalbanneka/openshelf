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
  resources: {
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
  },
}