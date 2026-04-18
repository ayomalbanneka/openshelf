export type ResourceType =
  | 'BOOK'
  | 'COURSE'
  | 'EXAM_PAPER'
  | 'DOCUMENT'
  | 'AUDIO'

export type Role = 'ADMIN' | 'MODERATOR' | 'USER'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl?: string
  bio?: string
  country?: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface Resource {
  id: string
  title: string
  slug: string
  description?: string
  type: ResourceType
  language: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  thumbnailUrl?: string
  pageCount?: number
  duration?: number
  isPublished: boolean
  publishedAt?: string
  author?: string
  publisher?: string
  isbn?: string
  publicationYear?: number
  viewCount: number
  downloadCount: number
  uploadedBy: Pick<User, 'id' | 'name'>
  category: Pick<Category, 'id' | 'name' | 'slug'>
  tags: { tag: Tag }[]
  _count?: { reviews: number; bookmarks: number }
  createdAt: string
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  sortOrder: number
  duration?: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
}