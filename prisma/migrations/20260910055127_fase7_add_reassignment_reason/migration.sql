-- CreateEnum
CREATE TYPE "ReassignmentReason" AS ENUM ('PAUSED', 'GROUP_INVIABLE', 'STUDENT_REQUEST', 'MANUAL_REVIEW');

-- AlterTable
ALTER TABLE "Reassignment" ADD COLUMN     "reason" "ReassignmentReason" NOT NULL DEFAULT 'MANUAL_REVIEW';
