-- CreateTable
CREATE TABLE "permisos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "id" SERIAL NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE INDEX "permisos_modulo_idx" ON "permisos"("modulo");

-- CreateIndex
CREATE INDEX "permisos_activo_idx" ON "permisos"("activo");

-- CreateIndex
CREATE INDEX "roles_permisos_rol_id_idx" ON "roles_permisos"("rol_id");

-- CreateIndex
CREATE INDEX "roles_permisos_permiso_id_idx" ON "roles_permisos"("permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_permisos_rol_id_permiso_id_key" ON "roles_permisos"("rol_id", "permiso_id");

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "usuarios_tipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
