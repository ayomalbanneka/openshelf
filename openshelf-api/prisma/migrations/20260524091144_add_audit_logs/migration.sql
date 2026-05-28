-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('RESOURCE_PUBLISHED', 'RESOURCE_REJECTED', 'RESOURCE_DELETED', 'USER_ROLE_CHANGED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'STAFF_INVITED', 'STAFF_PROMOTED', 'STAFF_REVOKED', 'STAFF_INVITE_CANCELLED', 'REPORT_RESOLVED', 'REPORT_DISMISSED', 'CLUB_DELETED', 'CATEGORY_CREATED', 'CATEGORY_DELETED', 'TAG_DELETED');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
