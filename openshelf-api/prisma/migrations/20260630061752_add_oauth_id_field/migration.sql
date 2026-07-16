-- AlterTable
ALTER TABLE "users" ADD COLUMN     "oauthId" TEXT;

-- CreateIndex
CREATE INDEX "users_oauthProvider_oauthId_idx" ON "users"("oauthProvider", "oauthId");
