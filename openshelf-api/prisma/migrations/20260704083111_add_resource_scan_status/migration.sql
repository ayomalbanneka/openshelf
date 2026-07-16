-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'ERROR');

-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "scanError" TEXT,
ADD COLUMN     "scanStatus" "ScanStatus" NOT NULL DEFAULT 'PENDING';
