-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessibleModules" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "completedModules" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
