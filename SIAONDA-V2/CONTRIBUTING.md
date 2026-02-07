# Guía de Contribución - SIAONDA V2

Esta guía proporciona los lineamientos y mejores prácticas para contribuir al desarrollo de SIAONDA V2.

## Tabla de Contenidos

- [Configuración del Entorno](#configuración-del-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Estándares de Código](#estándares-de-código)
- [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
- [Git y Control de Versiones](#git-y-control-de-versiones)
- [Testing](#testing)
- [Documentación](#documentación)

## Configuración del Entorno

### Requisitos

- Node.js 20+
- PostgreSQL 16+
- Editor de código (recomendado: VS Code)

### Extensiones Recomendadas para VS Code

- ESLint
- Prettier
- Prisma
- TypeScript and JavaScript Language Features

## Estructura del Proyecto

```
SIAONDA-V2/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuraciones globales
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Lógica de negocio
│   │   ├── middleware/     # Middleware personalizado
│   │   └── utils/          # Funciones utilitarias
│   ├── prisma/
│   │   ├── schema.prisma   # Schema de base de datos
│   │   └── seeds/          # Scripts de seed
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/     # Componentes reutilizables
    │   ├── pages/          # Páginas principales
    │   ├── services/       # Llamadas a API
    │   ├── store/          # Estado global (Zustand)
    │   └── utils/          # Utilidades del frontend
    └── package.json
```

## Estándares de Código

### TypeScript

- **Siempre** tipar las variables, parámetros y retornos de funciones
- Evitar el uso de `any`, usar `unknown` cuando el tipo sea desconocido
- Usar interfaces para objetos con propiedades conocidas
- Usar tipos para uniones y primitivos

```typescript
// ✅ Correcto
interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

function obtenerUsuario(id: number): Promise<Usuario> {
  // ...
}

//  Incorrecto
function obtenerUsuario(id) {
  // ...
}
```

### Comentarios

- Agregar JSDoc a funciones públicas y exportadas
- Comentar lógica compleja o no obvia
- NO comentar código obvio

```typescript
/**
 * Calcula el precio total de un producto aplicando impuestos
 * @param precioBase - Precio base del producto
 * @param tasaImpuesto - Tasa de impuesto (0.18 para 18%)
 * @returns El precio total con impuestos incluidos
 */
function calcularPrecioTotal(precioBase: number, tasaImpuesto: number): number {
  return precioBase * (1 + tasaImpuesto);
}
```

### Formato de Código

- Usar Prettier para formateo automático
- Indentación: 2 espacios
- Punto y coma al final de cada sentencia
- Comillas simples para strings

## Convenciones de Nomenclatura

### Variables y Funciones

- `camelCase` para variables y funciones
- Nombres descriptivos y en español

```typescript
const numeroRegistro = 12345;
const obtenerFormulario = () => {};
```

### Componentes y Clases

- `PascalCase` para componentes de React y clases
- Nombre del archivo debe coincidir con el componente

```typescript
// Archivo: FormularioDetalle.tsx
export function FormularioDetalle() {
  // ...
}
```

### Constantes

- `UPPER_SNAKE_CASE` para constantes globales

```typescript
const MAX_ITEMS_PER_PAGE = 20;
const API_BASE_URL = "http://localhost:3000";
```

### Rutas de API

- Usar kebab-case
- Plural para colecciones
- Sustantivos, no verbos

```
GET    /api/formularios
GET    /api/formularios/:id
POST   /api/formularios
PUT    /api/formularios/:id
DELETE /api/formularios/:id
```

## Git y Control de Versiones

### Branches

- `main` - Rama principal (producción)
- `develop` - Rama de desarrollo
- `feature/nombre-feature` - Nuevas funcionalidades
- `fix/nombre-bug` - Corrección de bugs
- `hotfix/nombre-urgente` - Correcciones urgentes en producción

### Commits

Formato de mensajes de commit:

```
tipo(alcance): descripción breve

Descripción detallada (opcional)
```

**Tipos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato de código (sin cambios funcionales)
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

**Ejemplos:**

```
feat(aau): agregar validación de campos dinámicos
fix(auth): corregir validación de token expirado
docs(readme): actualizar instrucciones de instalación
refactor(usuarios): simplificar lógica de permisos
```

### Flujo de Trabajo

1. Crear branch desde `develop`
2. Hacer cambios y commits
3. Crear Pull Request hacia `develop`
4. Revisión de código
5. Merge después de aprobación

## Testing

### Backend

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

### Frontend

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch
```

## Documentación

### Documentar Funciones

- Todas las funciones exportadas deben tener JSDoc
- Incluir descripción, parámetros y retorno
- Incluir ejemplos para funciones complejas

### Actualizar README

- Mantener actualizado el README.md con cambios importantes
- Actualizar la documentación de API cuando se agreguen endpoints

### Comentarios en el Código

- Explicar el "por qué", no el "qué"
- Mantener comentarios actualizados con el código
- Eliminar código comentado antes de hacer commit

## Checklist Antes de Hacer Push

- [ ] El código compila sin errores
- [ ] El código pasa el linter (ESLint)
- [ ] El código está formateado (Prettier)
- [ ] Los tests pasan
- [ ] Se agregaron tests para nueva funcionalidad
- [ ] Se actualizó la documentación si es necesario
- [ ] Se removió código comentado o console.logs
- [ ] El commit message sigue las convenciones

## Recursos Adicionales

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de React](https://react.dev)
- [Documentación de Express](https://expressjs.com)
- [Guía de TypeScript](https://www.typescriptlang.org/docs)

## Contacto

Para preguntas o dudas sobre el desarrollo, contactar al equipo de desarrollo de ONDA.
