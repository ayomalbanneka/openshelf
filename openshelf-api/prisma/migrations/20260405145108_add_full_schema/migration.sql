/*
  Warnings:

  - You are about to drop the column `websiteUrl` on the `users` table. All the data in the column will be lost.
  - Made the column `preferredLanguage` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('BOOK', 'COURSE', 'EXAM_PAPER', 'DOCUMENT', 'AUDIO');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('PAST_PAPER', 'MODEL_PAPER', 'ASSIGNMENT', 'QUIZ');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'REVIEWED', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('OWNER', 'MODERATOR', 'MEMBER');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "websiteUrl",
ADD COLUMN     "website" TEXT,
ALTER COLUMN "preferredLanguage" SET NOT NULL;

-- CreateTable
CREATE TABLE "user_follows" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "pageCount" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "author" TEXT,
    "publisher" TEXT,
    "isbn" TEXT,
    "edition" TEXT,
    "publicationYear" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_tags" (
    "resourceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "resource_tags_pkey" PRIMARY KEY ("resourceId","tagId")
);

-- CreateTable
CREATE TABLE "exam_papers" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "grade" TEXT,
    "institution" TEXT,
    "semester" TEXT,
    "examType" "ExamType" NOT NULL DEFAULT 'PAST_PAPER',
    "markSchemeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examPaperId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "totalPages" INTEGER,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_lists" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "coverUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_list_items" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "listId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_members" (
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClubRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_members_pkey" PRIMARY KEY ("clubId","userId")
);

-- CreateTable
CREATE TABLE "club_discussions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "resourceId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_discussions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "resourceId" TEXT,
    "discussionId" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_follows_followerId_idx" ON "user_follows"("followerId");

-- CreateIndex
CREATE INDEX "user_follows_followingId_idx" ON "user_follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "resources_slug_key" ON "resources"("slug");

-- CreateIndex
CREATE INDEX "resources_slug_idx" ON "resources"("slug");

-- CreateIndex
CREATE INDEX "resources_type_idx" ON "resources"("type");

-- CreateIndex
CREATE INDEX "resources_categoryId_idx" ON "resources"("categoryId");

-- CreateIndex
CREATE INDEX "resources_uploadedById_idx" ON "resources"("uploadedById");

-- CreateIndex
CREATE INDEX "resources_isPublished_idx" ON "resources"("isPublished");

-- CreateIndex
CREATE INDEX "resources_language_idx" ON "resources"("language");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "exam_papers_resourceId_key" ON "exam_papers"("resourceId");

-- CreateIndex
CREATE INDEX "exam_papers_subject_idx" ON "exam_papers"("subject");

-- CreateIndex
CREATE INDEX "exam_papers_year_idx" ON "exam_papers"("year");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_userId_examPaperId_key" ON "submissions"("userId", "examPaperId");

-- CreateIndex
CREATE INDEX "reviews_resourceId_idx" ON "reviews"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_resourceId_key" ON "reviews"("userId", "resourceId");

-- CreateIndex
CREATE INDEX "reading_progress_userId_idx" ON "reading_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "reading_progress_userId_resourceId_key" ON "reading_progress"("userId", "resourceId");

-- CreateIndex
CREATE INDEX "bookmarks_userId_idx" ON "bookmarks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_resourceId_key" ON "bookmarks"("userId", "resourceId");

-- CreateIndex
CREATE INDEX "reading_lists_userId_idx" ON "reading_lists"("userId");

-- CreateIndex
CREATE INDEX "reading_lists_isPublic_idx" ON "reading_lists"("isPublic");

-- CreateIndex
CREATE INDEX "reading_list_items_listId_idx" ON "reading_list_items"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "reading_list_items_listId_resourceId_key" ON "reading_list_items"("listId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_slug_key" ON "clubs"("slug");

-- CreateIndex
CREATE INDEX "clubs_slug_idx" ON "clubs"("slug");

-- CreateIndex
CREATE INDEX "clubs_isPublic_idx" ON "clubs"("isPublic");

-- CreateIndex
CREATE INDEX "club_members_clubId_idx" ON "club_members"("clubId");

-- CreateIndex
CREATE INDEX "club_discussions_clubId_idx" ON "club_discussions"("clubId");

-- CreateIndex
CREATE INDEX "club_discussions_resourceId_idx" ON "club_discussions"("resourceId");

-- CreateIndex
CREATE INDEX "comments_resourceId_idx" ON "comments"("resourceId");

-- CreateIndex
CREATE INDEX "comments_discussionId_idx" ON "comments"("discussionId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "exam_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_lists" ADD CONSTRAINT "reading_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_list_items" ADD CONSTRAINT "reading_list_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "reading_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_list_items" ADD CONSTRAINT "reading_list_items_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_discussions" ADD CONSTRAINT "club_discussions_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_discussions" ADD CONSTRAINT "club_discussions_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_discussions" ADD CONSTRAINT "club_discussions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "club_discussions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
