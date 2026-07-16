import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies on every request
});

// ── CSRF token management ────────────────────────────────────
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

const fetchCsrfToken = async (): Promise<string> => {
  const { data } = await axios.get(`${BASE_URL}/csrf-token`, {
    withCredentials: true,
  });
  csrfToken = data.csrfToken;
  return data.csrfToken;
};

const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) return csrfToken;

  if (!csrfTokenPromise) {
    csrfTokenPromise = fetchCsrfToken().finally(() => {
      csrfTokenPromise = null;
    });
  }

  return csrfTokenPromise;
};

// ── Request interceptor — attach CSRF token ─────────────────
http.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method ?? '');

  if (mutating && typeof window !== 'undefined') {
    // Use cached token or fetch a fresh one
    const token = await getCsrfToken();
    config.headers['x-csrf-token'] = token;
  }

  return config;
});

// ── Response interceptor — auto-refresh on 401 ──────────────
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const isAuthEndpoint =
      typeof original?.url === 'string' &&
      (original.url.includes('/auth/login') ||
        original.url.includes('/auth/register') ||
        original.url.includes('/auth/refresh') ||
        original.url.includes('/auth/logout'));

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      try {
        // Refresh — cookie is sent automatically (path: /api/auth/refresh)
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });

        // Retry the original request — new access cookie is set automatically
        return http(original);
      } catch {
        // Refresh failed — redirect to appropriate login
        if (typeof window !== 'undefined') {
          const isAdmin = window.location.pathname.startsWith('/admin');
          window.location.href = isAdmin ? '/admin/login' : '/login';
        }
      }
    }

    // If CSRF token is rejected (403), fetch a fresh one and retry once
    if (
      error.response?.status === 403 &&
      error.response?.data?.message?.includes('csrf') &&
      !original._csrfRetry
    ) {
      original._csrfRetry = true;
      csrfToken = await fetchCsrfToken();
      original.headers['x-csrf-token'] = csrfToken;
      return http(original);
    }

    return Promise.reject(error);
  }
);

// ── API client — all existing endpoints unchanged ───────────
export const api = {
  users: {
    isFollowing: (id: string) => http.get(`/users/${id}/is-following`).then((r) => r.data),
    follow: (id: string) => http.post(`/users/${id}/follow`).then((r) => r.data),
    unfollow: (id: string) => http.delete(`/users/${id}/follow`).then((r) => r.data),
    updateProfile: (data: Record<string, string>) =>
      http.patch('/users/me', data).then((r) => r.data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      http.patch('/users/me/password', data).then((r) => r.data),
    uploadAvatar: (file: File) => {
      const form = new FormData();
      form.append('avatar', file);
      return http
        .post('/users/me/avatar', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    },
  },
  lists: {
    getMine: (page = 1, limit = 10) =>
      http.get(`/lists/mine?page=${page}&limit=${limit}`).then((r) => r.data),
    getOne: (id: string) => http.get(`/lists/${id}`).then((r) => r.data),
    create: (data: { title: string; description?: string; isPublic?: boolean }) =>
      http.post('/lists', data).then((r) => r.data),
    update: (id: string, data: { title?: string; description?: string; isPublic?: boolean }) =>
      http.patch(`/lists/${id}`, data).then((r) => r.data),
    remove: (id: string) => http.delete(`/lists/${id}`).then((r) => r.data),
    addItem: (id: string, resourceId: string, note?: string) =>
      http.post(`/lists/${id}/items`, { resourceId, note }).then((r) => r.data),
    removeItem: (id: string, itemId: string) =>
      http.delete(`/lists/${id}/items/${itemId}`).then((r) => r.data),
  },
  clubs: {
    list: (params?: { search?: string; page?: number }) =>
      http.get('/clubs', { params }).then((r) => r.data),
    getOne: (slug: string) => http.get(`/clubs/${slug}`).then((r) => r.data),
    create: (data: { name: string; description?: string; isPublic?: boolean }) =>
      http.post('/clubs', data).then((r) => r.data),
    join: (slug: string) => http.post(`/clubs/${slug}/join`).then((r) => r.data),
    leave: (slug: string) => http.delete(`/clubs/${slug}/leave`).then((r) => r.data),
    getMembership: (slug: string) => http.get(`/clubs/${slug}/membership`).then((r) => r.data),
    getDiscussions: (slug: string) => http.get(`/clubs/${slug}/discussions`).then((r) => r.data),
    createDiscussion: (slug: string, data: { title: string; body: string; resourceId?: string }) =>
      http.post(`/clubs/${slug}/discussions`, data).then((r) => r.data),
    getComments: (slug: string, discussionId: string) =>
      http.get(`/clubs/${slug}/discussions/${discussionId}/comments`).then((r) => r.data),
    createComment: (slug: string, discussionId: string, body: string) =>
      http
        .post(`/clubs/${slug}/discussions/${discussionId}/comments`, { body })
        .then((r) => r.data),
  },
  progress: {
    get: (resourceId: string) => http.get(`/progress/${resourceId}`).then((r) => r.data),
    update: (
      resourceId: string,
      data: {
        currentPage?: number;
        totalPages?: number;
        currentTime?: number;
        totalTime?: number;
      }
    ) => http.put(`/progress/${resourceId}`, data).then((r) => r.data),
    getMine: () => http.get('/progress/mine').then((r) => r.data),
    getCompleted: () => http.get('/progress/completed').then((r) => r.data),
  },
  comments: {
    getForResource: (slug: string) => http.get(`/resources/${slug}/comments`).then((r) => r.data),
    create: (slug: string, body: string, parentId?: string) =>
      http.post(`/resources/${slug}/comments`, { body, parentId }).then((r) => r.data),
    update: (id: string, body: string) =>
      http.patch(`/comments/${id}`, { body }).then((r) => r.data),
    delete: (id: string) => http.delete(`/comments/${id}`).then((r) => r.data),
  },

  payments: {
    checkout: (tier: 'SUPPORTER' | 'PATRON') =>
      http.post('/payments/checkout', { tier }).then((r) => r.data as { url: string }),
    portal: () => http.post('/payments/portal', {}).then((r) => r.data as { url: string }),
    sync: () => http.post('/payments/sync', {}).then((r) => r.data),
  },

  notifications: {
    updatePrefs: (prefs: Record<string, boolean>) =>
      http.patch('/users/me/notification-prefs', { prefs }).then((r) => r.data),
  },
};
