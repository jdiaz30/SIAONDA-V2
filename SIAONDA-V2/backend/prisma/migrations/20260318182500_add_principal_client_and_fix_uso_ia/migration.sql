-- AlterTable: Agregar campo esPrincipal a formularios_clientes
ALTER TABLE "formularios_clientes" ADD COLUMN "es_principal" BOOLEAN NOT NULL DEFAULT false;

-- Actualizar campos uso_ia: cambiar de checkbox (tipoId=6) a listado (tipoId=3) con opciones
UPDATE "formularios_campos"
SET "tipo_id" = 3, "opciones" = 'SI,NO'
WHERE "campo" = 'uso_ia' AND "tipo_id" = 6;

-- Comentario:
-- 1. esPrincipal permite seleccionar qué cliente aparece en el encabezado del certificado
-- 2. uso_ia ahora es listado para permitir seleccionar SI o NO (antes solo checkbox=true)
