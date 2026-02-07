-- AlterTable (con protección IF NOT EXISTS)
ALTER TABLE "historial_entregas"
ADD COLUMN IF NOT EXISTS "nombre_receptor" VARCHAR(200),
ADD COLUMN IF NOT EXISTS "cedula_receptor" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "es_representante" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "ruta_documento_legal" VARCHAR(500);
