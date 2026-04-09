import { serverApi } from '@/lib/server-api'
import { UploadForm } from "@/components/resource/UploadForm"
import { RequireAuth } from '@/components/auth/RequireAuth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Upload resource' }

export default async function UploadPage() {
    const categories = await serverApi.categories.list()

    return (
        <RequireAuth>
            <div className="max-w-2xl mx-auto px-4 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-1">Upload a resource</h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Share a book, course, exam paper, document or audio file with the world.
                    </p>
                </div>
                <UploadForm categories={categories} />
            </div>
        </RequireAuth>
    )
}