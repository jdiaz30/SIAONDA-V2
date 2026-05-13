#!/bin/bash
# =====================================================
# Script de Inicialización de Base de Datos SIAONDA
# =====================================================
# Se ejecuta automáticamente la primera vez que se crea
# el contenedor de PostgreSQL

set -e  # Sale si hay algún error

echo "🚀 Iniciando configuración de base de datos SIAONDA..."

# Conecta a PostgreSQL y crea extensiones necesarias
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Extensión para generar UUIDs
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Extensión para búsqueda de texto completo
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";

    -- Extensión para funciones adicionales
    CREATE EXTENSION IF NOT EXISTS "unaccent";

    -- Muestra las extensiones instaladas
    SELECT * FROM pg_extension;
EOSQL

echo "✅ Base de datos configurada correctamente"
echo "📋 Extensiones instaladas: uuid-ossp, pg_trgm, unaccent"
echo ""
echo "⏳ Las migraciones de Prisma se ejecutarán cuando inicie el backend..."
