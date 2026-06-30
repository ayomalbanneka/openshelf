/*
  Warnings:

  - A unique constraint covering the columns `[email,oauthProvider]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'GITHUB');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "oauthProvider" "OAuthProvider",
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_oauthProvider_key" ON "users"("email", "oauthProvider");
