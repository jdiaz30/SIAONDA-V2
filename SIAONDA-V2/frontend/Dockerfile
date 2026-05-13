# ========================================
# STAGE 1: Builder (Construcción)
# ========================================
FROM node:20-alpine AS builder

LABEL maintainer="SIAONDA Team"
LABEL description="Frontend de SIAONDA - Sistema Integral ONDA"

WORKDIR /app

# Copia archivos de dependencias
COPY package*.json ./

# Instala dependencias
RUN npm ci

# Copia el código fuente
COPY . .

# Build de producción con Vite
# Genera la carpeta /dist con archivos estáticos optimizados
RUN npm run build

# ========================================
# STAGE 2: Production con Nginx
# ========================================
# Nginx: Servidor web ligero y rápido para servir archivos estáticos
FROM nginx:alpine

# Instala curl para health checks
RUN apk add --no-cache curl

# Copia los archivos estáticos generados por Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone puerto 80 (HTTP)
EXPOSE 80

# Health check: verifica que Nginx esté sirviendo contenido
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Comando por defecto: inicia Nginx en modo foreground
CMD ["nginx", "-g", "daemon off;"]
