-- Crear tabla de historial de cambios de estado de formularios
CREATE TABLE "formularios_historial" (
    "id" SERIAL NOT NULL,
    "formulario_id" INTEGER NOT NULL,
    "estado_anterior_id" INTEGER,
    "estado_nuevo_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "mensaje" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formularios_historial_pkey" PRIMARY KEY ("id")
);

-- Crear índices
CREATE INDEX "formularios_historial_formulario_id_idx" ON "formularios_historial"("formulario_id");
CREATE INDEX "formularios_historial_fecha_idx" ON "formularios_historial"("fecha");

-- Agregar claves foráneas
ALTER TABLE "formularios_historial" ADD CONSTRAINT "formularios_historial_formulario_id_fkey" FOREIGN KEY ("formulario_id") REFERENCES "formularios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "formularios_historial" ADD CONSTRAINT "formularios_historial_estado_anterior_id_fkey" FOREIGN KEY ("estado_anterior_id") REFERENCES "formularios_estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "formularios_historial" ADD CONSTRAINT "formularios_historial_estado_nuevo_id_fkey" FOREIGN KEY ("estado_nuevo_id") REFERENCES "formularios_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "formularios_historial" ADD CONSTRAINT "formularios_historial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
