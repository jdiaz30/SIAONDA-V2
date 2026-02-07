-- Migration: Add support for Producciones (parent-child relationship for formularios)
-- Una producción es un formulario "padre" que agrupa varios formularios "hijos" (obras individuales)

-- Agregar campos para soportar producciones
ALTER TABLE "formularios"
ADD COLUMN "es_produccion" BOOLEAN DEFAULT false,
ADD COLUMN "produccion_padre_id" INTEGER,
ADD COLUMN "titulo_produccion" VARCHAR(500);

-- Crear foreign key para la relación padre-hijo
ALTER TABLE "formularios"
ADD CONSTRAINT "formularios_produccion_padre_fkey"
FOREIGN KEY ("produccion_padre_id")
REFERENCES "formularios"("id")
ON DELETE CASCADE;

-- Crear índices para mejorar performance
CREATE INDEX "formularios_es_produccion_idx" ON "formularios"("es_produccion");
CREATE INDEX "formularios_produccion_padre_id_idx" ON "formularios"("produccion_padre_id");

-- Comentarios para documentación
COMMENT ON COLUMN "formularios"."es_produccion" IS 'Indica si este formulario es una producción (agrupa varias obras)';
COMMENT ON COLUMN "formularios"."produccion_padre_id" IS 'ID del formulario padre si esta obra pertenece a una producción';
COMMENT ON COLUMN "formularios"."titulo_produccion" IS 'Título de la producción (solo se usa si es_produccion = true)';
