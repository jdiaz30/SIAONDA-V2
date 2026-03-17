-- AlterTable: Agregar sucursalId y sucursalOriginalId a usuarios
ALTER TABLE "usuarios" ADD COLUMN "sucursal_id" INTEGER;
ALTER TABLE "usuarios" ADD COLUMN "sucursal_original_id" INTEGER;

-- AlterTable: Agregar sucursalId a formularios
ALTER TABLE "formularios" ADD COLUMN "sucursal_id" INTEGER;

-- AddForeignKey: Usuarios -> Sucursales
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursal_id_fkey"
  FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursal_original_id_fkey"
  FOREIGN KEY ("sucursal_original_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Formularios -> Sucursales
ALTER TABLE "formularios" ADD CONSTRAINT "formularios_sucursal_id_fkey"
  FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: Índices para mejorar performance
CREATE INDEX "usuarios_sucursal_id_idx" ON "usuarios"("sucursal_id");
CREATE INDEX "formularios_sucursal_id_idx" ON "formularios"("sucursal_id");
