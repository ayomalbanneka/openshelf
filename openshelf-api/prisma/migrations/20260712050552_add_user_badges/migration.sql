-- AlterTable
ALTER TABLE "users" ADD COLUMN     "badges" JSONB NOT NULL DEFAULT '[]';
