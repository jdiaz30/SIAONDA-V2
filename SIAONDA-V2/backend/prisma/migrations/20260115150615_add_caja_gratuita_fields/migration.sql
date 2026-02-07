-- AlterTable
ALTER TABLE "cajas" ADD COLUMN     "es_gratuita" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "motivo_gratuito" VARCHAR(500);

-- CreateIndex
CREATE INDEX "cajas_es_gratuita_idx" ON "cajas"("es_gratuita");
