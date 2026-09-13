-- Fase 8: eliminar cola de reasignación y ciclado múltiple, agregar pausedAt y graduatedAt
-- Backfill se ejecuta antes de dropear la tabla Reassignment para preservar la fecha de graduación existente.

-- 1. Agregar nuevas columnas a User
ALTER TABLE "User" ADD COLUMN "pausedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "graduatedAt" TIMESTAMP(3);

-- 2. Backfill pausedAt para usuarios ya en PAUSED
UPDATE "User" SET "pausedAt" = NOW() WHERE "status" = 'PAUSED';

-- 3. Backfill graduatedAt desde Reassignment.resolvedAt (si existe registro válido); fallback a NOW()
UPDATE "User" u
SET "graduatedAt" = COALESCE(r."resolvedAt", NOW())
FROM "Reassignment" r
WHERE r."userId" = u."id" AND u."status" = 'GRADUATED';

UPDATE "User"
SET "graduatedAt" = NOW()
WHERE "status" = 'GRADUATED' AND "graduatedAt" IS NULL;

-- 4. Eliminar tabla Reassignment y sus enums
DROP TABLE "Reassignment";
DROP TYPE "ReassignmentStatus";
DROP TYPE "ReassignmentReason";

-- 5. Eliminar campo currentCycle de Group
ALTER TABLE "Group" DROP COLUMN "currentCycle";
