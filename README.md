# CCP Backend

API REST para la plataforma privada de e-learning del programa CCP (Centro de Crecimiento Personal) de Only One Coaching. Reemplaza la distribución de links de Vimeo por email con un sistema de acceso progresivo por cohortes.

## Stack

- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express 5
- **Arquitectura:** Domain-Driven Design (DDD)
- **ORM:** Prisma + PostgreSQL (Supabase)
- **Auth:** JWT (access 15min + refresh 30 días)
- **Email:** SendGrid + React Email
- **Video:** Vimeo Pro (domain lock)
- **Tests:** Vitest
- **Deploy:** Railway

## Requisitos previos

- Node.js 20+
- Cuenta en Supabase (PostgreSQL)
- API key de SendGrid
- Access token de Vimeo

## Levantar en local

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd backend-ccp
npm install

# 2. Variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Aplicar migraciones y generar cliente Prisma
npx prisma migrate deploy
npx prisma generate

# 4. Arrancar en modo desarrollo
npm run dev
```

El servidor corre en `http://localhost:3000` por defecto.

## Variables de entorno

| Variable              | Descripción                                 |
| --------------------- | ------------------------------------------- |
| `DATABASE_URL`        | Connection string de Supabase (pooler)      |
| `DIRECT_URL`          | Connection string directa (migraciones)     |
| `JWT_SECRET`          | Secreto para access tokens (mín. 32 chars)  |
| `JWT_REFRESH_SECRET`  | Secreto para refresh tokens (mín. 32 chars) |
| `SENDGRID_API_KEY`    | API key de SendGrid                         |
| `SENDGRID_FROM_EMAIL` | Email remitente verificado en SendGrid      |
| `VIMEO_ACCESS_TOKEN`  | Token de Vimeo para validar URLs de clases  |
| `FRONTEND_URL`        | URL del frontend (CORS)                     |
| `PORT`                | Puerto del servidor (default: 3000)         |
| `NODE_ENV`            | `development` \| `production`               |

## Scripts

```bash
npm run dev          # Servidor en modo watch (tsx)
npm run build        # Compilar a dist/
npm start            # Correr build de producción
npm test             # Tests con Vitest
npm run type-check   # Verificar tipos sin emitir
npm run lint         # ESLint
npm run format       # Prettier
```

## Roles y acceso

| Rol       | Acceso                                                     |
| --------- | ---------------------------------------------------------- |
| `COACH`   | Admin total — usuarios, grupos, módulos, clases, dashboard |
| `TEACHER` | Gestión de contenido (clases/módulos) + lectura dashboard  |
| `STUDENT` | Solo módulos desbloqueados para su cohorte                 |

Los estudiantes acceden únicamente a módulos entre su `entryModule` y el módulo actual de su grupo. Las clases de módulos anteriores al `entryModule` no son visibles.

## Autenticación

Todos los endpoints protegidos requieren:

```
Authorization: Bearer <accessToken>
```

El access token expira en 15 minutos. Rotar con:

```
POST /auth/refresh  →  { refreshToken }
```

## Endpoints principales

| Método | Ruta                           | Descripción                                           |
| ------ | ------------------------------ | ----------------------------------------------------- |
| POST   | `/auth/login`                  | Login, retorna tokens + user                          |
| POST   | `/auth/refresh`                | Rota refresh token                                    |
| GET    | `/auth/me`                     | Perfil del usuario autenticado                        |
| GET    | `/auth/activate?token=`        | Valida token de activación                            |
| POST   | `/auth/activate`               | Activa cuenta con nombre + contraseña                 |
| POST   | `/auth/password/reset`         | Solicita reset de contraseña                          |
| POST   | `/auth/password/reset/confirm` | Confirma reset con token                              |
| GET    | `/me/modules`                  | Módulos desbloqueados del estudiante                  |
| GET    | `/me/classes`                  | Clases visibles para el estudiante                    |
| GET    | `/users`                       | Lista usuarios (filtros: name, role, status, groupId) |
| POST   | `/users`                       | Crea usuario, envía email de activación               |
| PATCH  | `/users/:id`                   | Edición parcial; `groupId` asigna/remueve del grupo   |
| GET    | `/groups`                      | Lista grupos                                          |
| POST   | `/groups`                      | Crea grupo con lista inicial de estudiantes           |
| POST   | `/groups/:id/advance`          | Avanza al siguiente módulo                            |
| POST   | `/groups/:id/retreat`          | Retrocede un módulo                                   |
| GET    | `/modules`                     | Lista los 9 módulos                                   |
| PUT    | `/modules/:number`             | Edita título y descripción                            |
| GET    | `/classes`                     | Lista clases (`?moduleNumber=` para filtrar)          |
| POST   | `/classes`                     | Crea clase con URL de Vimeo validada                  |
| POST   | `/classes/:id/publish`         | Publica inmediatamente o programa                     |
| PUT    | `/progress`                    | Upsert de progreso (pct, posición, completado)        |
| GET    | `/reassignments`               | Cola de reasignaciones pendientes                     |
| POST   | `/reassignments/:id/resolve`   | Asigna a nuevo grupo                                  |
| POST   | `/reassignments/:id/graduate`  | Marca como graduado                                   |
| GET    | `/dashboard/summary`           | Métricas generales                                    |
| GET    | `/notifications`               | Reasignaciones pendientes + clases próximas 48h       |
| GET    | `/health`                      | Estado del servidor                                   |

Referencia completa en [`docs/api-endpoints.md`](docs/api-endpoints.md).

## Formato de errores

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Usuario no encontrado",
    "details": {}
  }
}
```

| Código HTTP | Cuándo                       |
| ----------- | ---------------------------- |
| 400         | Input inválido               |
| 401         | Sin token o token expirado   |
| 403         | Sin permisos para esa acción |
| 404         | Recurso no encontrado        |
| 409         | Conflicto de estado          |
| 410         | Token ya usado o expirado    |
| 422         | Regla de negocio violada     |

## CI/CD

GitHub Actions corre en cada push a `main` y `dev`:

1. Install → Prisma generate → Format check → Lint → Type-check → Tests → Build

Railway despliega automáticamente desde `main` al pasar el pipeline.
