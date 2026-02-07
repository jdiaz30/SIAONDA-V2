-- Agregar campos para múltiples años de vigencia en IRC
ALTER TABLE "solicitudes_registro_inspeccion" 
ADD COLUMN "anos_vigencia" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "fecha_vencimiento" TIMESTAMP(3);

-- Actualizar fecha de vencimiento para solicitudes existentes (1 año desde fecha de pago)
UPDATE "solicitudes_registro_inspeccion" 
SET "fecha_vencimiento" = "fecha_pago" + INTERVAL '1 year'
WHERE "fecha_pago" IS NOT NULL;

-- Comentario: anos_vigencia indica cuántos años se pagaron (1, 2, 3, etc.)
-- fecha_vencimiento se calcula como: fecha_pago + (anos_vigencia * 1 año)
