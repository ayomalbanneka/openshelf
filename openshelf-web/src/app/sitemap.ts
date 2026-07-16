import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://openshelf.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

// Static routes with their change frequency and priority
const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/browse`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Fetch published resources for dynamic routes
    let resourceRoutes: MetadataRoute.Sitemap = []
    let userRoutes: MetadataRoute.Sitemap = []

    try {
        const [resourcesRes, usersRes] = await Promise.allSettled([
            fetch(`${API_URL}/resources?limit=1000&status=PUBLISHED`, {
                next: { revalidate: 3600 }, // revalidate every hour
            }),
            fetch(`${API_URL}/users?limit=1000`, {
                next: { revalidate: 3600 },
            }),
        ])

        if (resourcesRes.status === 'fulfilled' && resourcesRes.value.ok) {
            const data = await resourcesRes.value.json()
            const resources: Array<{ slug: string; updatedAt: string }> = data.resources ?? data.data ?? []
            resourceRoutes = resources.map((r) => ({
                url: `${BASE_URL}/resources/${r.slug}`,
                lastModified: new Date(r.updatedAt),
                changeFrequency: 'weekly',
                priority: 0.7,
            }))
        }

        if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
            const data = await usersRes.value.json()
            const users: Array<{ id: string; updatedAt: string }> = data.users ?? data.data ?? []
            userRoutes = users.map((u) => ({
                url: `${BASE_URL}/users/${u.id}`,
                lastModified: new Date(u.updatedAt),
                changeFrequency: 'weekly',
                priority: 0.5,
            }))
        }
    } catch {
        // Fail gracefully — sitemap still includes static routes
    }

    return [...staticRoutes, ...resourceRoutes, ...userRoutes]
}