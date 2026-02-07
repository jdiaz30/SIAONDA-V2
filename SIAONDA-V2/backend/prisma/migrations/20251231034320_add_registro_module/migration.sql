-- CreateTable
CREATE TABLE "registros" (
    "id" SERIAL NOT NULL,
    "numeroRegistro" VARCHAR(50) NOT NULL,
    "formulario_producto_id" INTEGER NOT NULL,
    "fecha_asentamiento" TIMESTAMP(3) NOT NULL,
    "tipo_obra" VARCHAR(100) NOT NULL,
    "titulo_obra" VARCHAR(500) NOT NULL,
    "certificado_generado" VARCHAR(500),
    "certificado_firmado" VARCHAR(500),
    "url_firma_gob" VARCHAR(500),
    "estado_id" INTEGER NOT NULL,
    "usuario_asentamiento_id" INTEGER NOT NULL,
    "fecha_generacion_cert" TIMESTAMP(3),
    "fecha_envio_firma" TIMESTAMP(3),
    "fecha_firma_cert" TIMESTAMP(3),
    "fecha_enviado_aau" TIMESTAMP(3),
    "fecha_entregado" TIMESTAMP(3),
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_estados" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "registros_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secuencias_registro" (
    "id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "secuencia" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secuencias_registro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registros_numeroRegistro_key" ON "registros"("numeroRegistro");

-- CreateIndex
CREATE INDEX "registros_numeroRegistro_idx" ON "registros"("numeroRegistro");

-- CreateIndex
CREATE INDEX "registros_formulario_producto_id_idx" ON "registros"("formulario_producto_id");

-- CreateIndex
CREATE INDEX "registros_estado_id_idx" ON "registros"("estado_id");

-- CreateIndex
CREATE INDEX "registros_fecha_asentamiento_idx" ON "registros"("fecha_asentamiento");

-- CreateIndex
CREATE UNIQUE INDEX "registros_estados_nombre_key" ON "registros_estados"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "secuencias_registro_anio_key" ON "secuencias_registro"("anio");

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_formulario_producto_id_fkey" FOREIGN KEY ("formulario_producto_id") REFERENCES "formularios_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "registros_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_usuario_asentamiento_id_fkey" FOREIGN KEY ("usuario_asentamiento_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
