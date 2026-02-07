# SIAONDA V2

**Sistema Integral de la Oficina Nacional de Derecho de Autor - Versión 2**

Sistema de gestión integral para la ONDA (Oficina Nacional de Derecho de Autor de la República Dominicana), desarrollado con tecnologías modernas y siguiendo las mejores prácticas de desarrollo de software.

## Descripción

SIAONDA V2 es una reescritura completa del sistema SIAONDA, manteniendo 100% de la funcionalidad original pero con tecnologías actuales, mejor rendimiento, seguridad mejorada y una experiencia de usuario moderna.

## Stack Tecnológico

### Backend
- **Node.js 20+** con **TypeScript**
- **Express.js** - Framework web
- **Prisma ORM** - Gestión de base de datos
- **PostgreSQL 16** - Base de datos
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas

### Frontend
- **React 18** con **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Estilos
- **shadcn/ui** - Componentes UI
- **React Router** - Enrutamiento
- **Zustand** - State management
- **React Query** - Data fetching

### Herramientas
- **PDFKit** / **Puppeteer** - Generación de PDFs
- **Nodemailer** - Envío de emails
- **date-fns** - Manejo de fechas
- **zod** - Validación de schemas

## Estructura del Proyecto

```
SIAONDA-V2/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── config/         # Configuraciones
│   │   ├── controllers/    # Controladores
│   │   ├── routes/         # Rutas de API
│   │   ├── services/       # Lógica de negocio
│   │   ├── models/         # Modelos de datos
│   │   ├── middleware/     # Middleware (auth, validation)
│   │   ├── utils/          # Utilidades
│   │   └── index.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma   # Schema de base de datos
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas/Vistas
│   │   ├── layouts/        # Layouts
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API calls
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utilidades
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docs/                   # Documentación
│   ├── API.md             # Documentación de API
│   ├── DATABASE.md        # Estructura de BD
│   └── FLOWS.md           # Flujos de operaciones
│
└── README.md
```

## Características

### Módulos Principales

1. **Autenticación y Usuarios**
   - 13 roles de usuario (excluido Almacén)
   - JWT con refresh tokens
   - Gestión de permisos granular

2. **Gestión de Obras (Formularios)**
   - 12 tipos de obras
   - Campos dinámicos configurables
   - Firma digital
   - Archivos adjuntos

3. **Sistema de Cajas**
   - Apertura/cierre de caja
   - Control de efectivo
   - Reportes de cierre

4. **Certificados**
   - Generación automática
   - PDFs personalizados
   - Control de entrega

5. **Facturas y Pagos**
   - Facturación con NCF (Comprobantes Fiscales RD)
   - Múltiples métodos de pago
   - Conciliación automática

6. **Clientes/Autores**
   - Registro de personas físicas/jurídicas
   - Gestión de documentos
   - Historial completo

7. **Reportes**
   - Reportes en PDF y CSV
   - Dashboards analíticos
   - Exportación de datos

> **Nota**: El módulo de Almacén ha sido excluido de la versión 2

## Roles de Usuario

1. Cajero
2. Contable
3. Administrador
4. Servicio al Cliente
5. Admin Serv Cliente
6. Regional
7. Digitador
8. Recepcion Clientes
9. Asentamiento
10. Registro
11. Admin Registro
12. Administrativo
13. Inspectoria

> **Nota**: El rol "Almacén" ha sido excluido de esta versión

## Inicio Rápido

### Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 20+
- **PostgreSQL** 16+
- **npm** o **yarn**
- **Git**

### Instalación

#### 1. Clonar el repositorio

```bash
git clone https://github.com/jdiaz30/SIAONDA-V2.git
cd SIAONDA-V2
```

#### 2. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración de base de datos:
# - DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/siaonda_v2"
# - JWT_SECRET="tu-secret-key-segura"
# - PORT=3000

# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones de base de datos
npx prisma migrate dev

# (Opcional) Poblar base de datos con datos iniciales
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

El backend estará corriendo en `http://localhost:3000`

#### 3. Configurar el Frontend

```bash
# En una nueva terminal
cd frontend

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
cp .env.example .env
# Verificar que VITE_API_URL apunte al backend correcto

# Iniciar aplicación de desarrollo
npm run dev
```

El frontend estará corriendo en `http://localhost:5173`

### Crear Base de Datos

Antes de ejecutar las migraciones, crea la base de datos en PostgreSQL:

```bash
# Acceder a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE siaonda_v2;

# Salir de PostgreSQL
\q
```

### Usuario por Defecto

Después de ejecutar el seed (`npm run seed`), puedes iniciar sesión con:

- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **IMPORTANTE**: Cambia esta contraseña después del primer inicio de sesión.

## Desarrollo

### Scripts Disponibles

#### Backend

```bash
npm run dev          # Iniciar en modo desarrollo
npm run build        # Compilar TypeScript
npm run start        # Ejecutar producción
npm run prisma:studio # Abrir Prisma Studio
npm run seed         # Poblar base de datos
```

#### Frontend

```bash
npm run dev          # Iniciar en modo desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Ejecutar linter
```

## Principios de Desarrollo

- **Fidelidad 100%**: Replicar exactamente la lógica de negocio del sistema original
- **Código limpio**: TypeScript, ESLint, Prettier
- **Seguridad**: Validación de inputs, protección CSRF, SQL injection prevention
- **Performance**: Optimización de queries, lazy loading, caché
- **UX moderna**: Diseño intuitivo, responsive, accesible
- **Documentación**: Código autodocumentado, comentarios donde sea necesario

## Licencia

Propiedad de la Oficina Nacional de Derecho de Autor (ONDA) - República Dominicana

---

**Versión**: 2.0.0
**Fecha de inicio**: 28 de octubre de 2025
**Estado**: En desarrollo
