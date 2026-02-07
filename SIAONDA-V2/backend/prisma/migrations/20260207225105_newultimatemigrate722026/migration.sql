/*
  Warnings:

  - Made the column `es_produccion` on table `formularios` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "formularios" DROP CONSTRAINT "formularios_produccion_padre_fkey";

-- AlterTable
ALTER TABLE "formularios" ALTER COLUMN "es_produccion" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "formularios" ADD CONSTRAINT "formularios_produccion_padre_id_fkey" FOREIGN KEY ("produccion_padre_id") REFERENCES "formularios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
