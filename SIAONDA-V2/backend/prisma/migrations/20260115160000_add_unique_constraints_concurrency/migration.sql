-- Add UNIQUE constraints to prevent duplicate codes in concurrent scenarios

-- Formularios: codigo debe ser único
CREATE UNIQUE INDEX IF NOT EXISTS "formularios_codigo_unique" ON "formularios"("codigo");

-- Cajas: codigo debe ser único
CREATE UNIQUE INDEX IF NOT EXISTS "cajas_codigo_unique" ON "cajas"("codigo");

-- Facturas: codigo debe ser único
CREATE UNIQUE INDEX IF NOT EXISTS "facturas_codigo_unique" ON "facturas"("codigo");

-- Facturas: ncf debe ser único (cuando no es null)
CREATE UNIQUE INDEX IF NOT EXISTS "facturas_ncf_unique" ON "facturas"("ncf") WHERE "ncf" IS NOT NULL;

-- Registros: numeroRegistro debe ser único (usando camelCase ya que no tiene @map)
CREATE UNIQUE INDEX IF NOT EXISTS "registros_numero_registro_unique" ON "registros"("numeroRegistro");
