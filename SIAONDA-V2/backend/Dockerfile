# ========================================
# STAGE 1: Builder (Construcción)
# ========================================
# Usa Node.js versión 20 LTS como base (Alpine = versión ligera de Linux)
FROM node:20-alpine AS builder

# Información del mantenedor
LABEL maintainer="SIAONDA Team"
LABEL description="Backend de SIAONDA - Sistema Integral ONDA"

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instala herramientas necesarias para compilar dependencias nativas
# - python3: Para módulos que requieren compilación
# - make, g++: Compiladores de C/C++
# - openssl: Para generación de claves y certificados
RUN apk add --no-cache python3 make g++ openssl

# Copia solo los archivos de dependencias primero (aprovecha cache de Docker)
# Si package.json no cambia, Docker reutiliza esta capa
COPY package*.json ./
COPY prisma ./prisma/

# Instala TODAS las dependencias (incluyendo devDependencies para Prisma)
RUN npm ci

# Genera el cliente de Prisma (necesario para que TypeScript funcione)
RUN npx prisma generate

# Copia el resto del código fuente
COPY . .

# Compila TypeScript a JavaScript (genera carpeta /dist)
RUN npm run build

# ========================================
# STAGE 2: Production (Producción)
# ========================================
# Segunda etapa: imagen final más pequeña (sin devDependencies)
FROM node:20-alpine

# Instala herramientas de sistema necesarias
# Nota: Prisma necesita OpenSSL 1.1, pero usaremos variables de entorno para compatibilidad
RUN apk add --no-cache curl postgresql-client

# Instala OpenSSL 3 (disponible en Alpine 3.23+) y crea symlink para compatibilidad
RUN apk add --no-cache openssl libc6-compat

# Crea un usuario no-root por seguridad (mejores prácticas)
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Instala SOLO dependencias de producción (sin devDependencies)
RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

# Copia el código compilado desde la etapa builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Crea directorios de uploads con permisos correctos
RUN mkdir -p /app/uploads/formularios /app/uploads/certificados /app/uploads/facturas /app/uploads/archivos /app/uploads/temp && \
    chown -R nodejs:nodejs /app

# Cambia a usuario no-root
USER nodejs

# Expone el puerto 3000 (información, no abre el puerto automáticamente)
EXPOSE 3000

# Health check: verifica que el servidor esté respondiendo
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando por defecto al iniciar el contenedor
# Se puede sobrescribir en docker-compose.yml
CMD ["node", "dist/index.js"]
