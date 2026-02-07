-- CreateTable
CREATE TABLE "historial_entregas" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(10) NOT NULL,
    "formulario_id" INTEGER,
    "solicitud_irc_id" INTEGER,
    "certificado_codigo" VARCHAR(50) NOT NULL,
    "numero_registro" VARCHAR(50),
    "cliente_nombre" VARCHAR(200) NOT NULL,
    "cliente_telefono" VARCHAR(20),
    "categoria" VARCHAR(100) NOT NULL,
    "usuario_entrega_id" INTEGER NOT NULL,
    "fecha_entrega" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "historial_entregas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historial_entregas_tipo_idx" ON "historial_entregas"("tipo");

-- CreateIndex
CREATE INDEX "historial_entregas_fecha_entrega_idx" ON "historial_entregas"("fecha_entrega");

-- CreateIndex
CREATE INDEX "historial_entregas_usuario_entrega_id_idx" ON "historial_entregas"("usuario_entrega_id");

-- CreateIndex
CREATE INDEX "historial_entregas_formulario_id_idx" ON "historial_entregas"("formulario_id");

-- CreateIndex
CREATE INDEX "historial_entregas_solicitud_irc_id_idx" ON "historial_entregas"("solicitud_irc_id");

-- AddForeignKey
ALTER TABLE "historial_entregas" ADD CONSTRAINT "historial_entregas_formulario_id_fkey" FOREIGN KEY ("formulario_id") REFERENCES "formularios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_entregas" ADD CONSTRAINT "historial_entregas_solicitud_irc_id_fkey" FOREIGN KEY ("solicitud_irc_id") REFERENCES "solicitudes_registro_inspeccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_entregas" ADD CONSTRAINT "historial_entregas_usuario_entrega_id_fkey" FOREIGN KEY ("usuario_entrega_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
