-- CreateEnum
CREATE TYPE "EmailVerificationType" AS ENUM ('EMAIL_VERIFICATION', 'ADMIN_2FA');

-- DropIndex
DROP INDEX "email_verifications_code_idx";

-- AlterTable
ALTER TABLE "email_verifications" ADD COLUMN     "type" "EmailVerificationType" NOT NULL DEFAULT 'EMAIL_VERIFICATION';

-- CreateIndex
CREATE INDEX "email_verifications_userId_type_idx" ON "email_verifications"("userId", "type");
