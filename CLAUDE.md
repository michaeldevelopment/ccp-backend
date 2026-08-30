# CCP Platform — Backend Reference

## Contexto del Proyecto

Plataforma privada de e-learning para el programa CCP (Centro de Crecimiento Personal) de Only One Coaching. 9 módulos distribuidos en 3 semestres con clases en vivo semanales. Reemplaza la distribución de links de Vimeo por email.

**Tres roles:** Coach (admin total) / Teacher (gestión de contenido) / Student (acceso por cohorte).

---

## Stack

```
Node.js + TypeScript
Express
Domain-Driven Design (DDD)
Prisma ORM + PostgreSQL (Supabase)
Zod (validación de input y env vars)
Bcrypt — campo almacenado como `passwordHash`
JWT — access token (15min) + refresh token (30 días)
SendGrid + React Email (transaccional)
Winston (logging estructurado en JSON)
Vitest (unitario + integración)
ESLint + Prettier + Husky (pre-commit)
```

**Infra:**

| Componente       | Proveedor                               |
| ---------------- | --------------------------------------- |
| Backend          | Railway                                 |
| Base de datos    | Supabase (PostgreSQL)                   |
| Email            | SendGrid                                |
| Video            | Vimeo Pro (domain lock)                 |
| Storage adjuntos | Google Drive links (sin gestión propia) |

---

## Arquitectura — DDD

```
Presentation   →  Controllers, Routes, DTOs, Middleware
Application    →  Use Cases (orquestan flujo, sin lógica de dominio)
Domain         →  Entities, Value Objects, Repository interfaces, Domain Services
Infrastructure →  Prisma, SendGrid adapter, Vimeo adapter, config
```

### Estructura de carpetas

```
src/
├── domain/
│   ├── user/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── repositories/       # interfaces (contratos)
│   │   └── services/
│   ├── group/
│   ├── module/
│   ├── class/
│   └── shared/
├── application/
│   ├── user/use-cases/
│   ├── group/use-cases/
│   ├── module/use-cases/
│   └── class/use-cases/
├── infrastructure/
│   ├── persistence/prisma/     # implementaciones de repositorios
│   ├── email/                  # SendGrid adapter
│   └── vimeo/                  # Vimeo adapter
├── presentation/
│   ├── http/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── middleware/
│   └── dtos/
├── config/                     # Zod env validation
└── app.ts
```

---

## Modelo de Dominio

### Roles

- `COACH` — acceso total
- `TEACHER` — gestión de contenido + dashboard en lectura
- `STUDENT` — solo módulos desbloqueados para su cohorte

### Estados de Usuario

**Estudiantes:**

| Estado                 | Descripción                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `PENDING_ACTIVATION`   | Cuenta creada, sin activar (solo sistema, no asignable manualmente) |
| `ACTIVE`               | Acceso completo según cohorte                                       |
| `PAUSED`               | Sin acceso, historial conservado                                    |
| `GRADUATED`            | Acceso solo lectura por 3 meses                                     |
| `PENDING_REASSIGNMENT` | Completó módulo 9 con módulos previos pendientes                    |

**Teachers:**

| Estado               | Descripción                |
| -------------------- | -------------------------- |
| `PENDING_ACTIVATION` | Cuenta creada, sin activar |
| `ACTIVE`             | Acceso normal              |
| `PAUSED`             | Sin acceso                 |

`GRADUATED` y `PENDING_REASSIGNMENT` son exclusivos de estudiantes. El backend retorna `400` si se intenta asignar estos estados a un teacher.

### Entidades Principales

- **User** — email, passwordHash, name, role, status, groupId, entryModule
- **Group** — name, entryModule (1–9), unlockedModules (int[])
- **Module** — number (1–9), title, description
- **Class** — title, vimeoUrl, description, attachments[], publishedAt, isPublished, notify
- **ActivationToken** — token (uuid), userId, usedAt (un solo uso, sin expiración)
- **PasswordResetToken** — token, userId, expiresAt (12h), usedAt
- **Progress** — userId, classId, pct (float), lastPositionSec (int), completed (bool)
- **Reassignment** — userId, status (PENDING | RESOLVED | GRADUATED | UNDONE), resolvedAt

---

## Reglas de Negocio Críticas

### Acceso Progresivo (núcleo del sistema)

- Un estudiante accede solo a módulos desbloqueados para su grupo, **desde su `user.entryModule` hasta el módulo actual del grupo**.
- Clases de módulos anteriores al `user.entryModule`: **no visibles**.
- Clases de módulos futuros (no desbloqueados por el coach): **no visibles**.
- Dentro de los módulos accesibles: todas las clases publicadas disponibles (incluidas anteriores para repaso).
- `user.entryModule` queda **congelado** al momento del ingreso al grupo. Los avances/retrocesos del grupo no lo modifican.

### Fin de Ciclo (Módulo 9)

- Al completar módulo 9: si `entryModule > 1` → estudiante pasa a `PENDING_REASSIGNMENT`.
- Si `entryModule == 1` → el coach puede marcarlo manualmente como `GRADUATED`.
- Estado `GRADUATED` otorga acceso solo lectura por 3 meses.

### Activación de Cuenta

- Al crear usuario → sistema envía email con link único (`/activate?token=<uuid>`).
- Token: un solo uso, sin expiración.
- Al activar: usuario ingresa nombre + contraseña → sistema guarda `passwordHash`, marca token como usado, cambia estado a `ACTIVE`, autentica automáticamente.
- Usuario en `PENDING_ACTIVATION`: no puede hacer login, no puede ser asignado a grupo. Solo acción disponible: eliminarlo.
- No existe endpoint de reenvío; si el estudiante pierde el email, el Coach elimina y recrea la cuenta.

### Avance de Módulos

- El Coach avanza o retrocede el módulo actual de un grupo vía `POST /groups/:id/advance` y `POST /groups/:id/retreat`.
- El avance agrega el siguiente número a `unlockedModules`. El retroceso lo remueve.
- Mínimo: `entryModule` del grupo. Máximo: módulo 9.
- Al avanzar al módulo 9 y completarlo: estudiantes con `entryModule > 1` pasan automáticamente a `PENDING_REASSIGNMENT`.

### Asignación de Estudiantes a Grupos

- **Al crear un grupo** (`POST /groups`): el body acepta `studentIds[]`. El backend actualiza `groupId` en cada usuario como efecto secundario atómico.
- **En cualquier otro momento** (`PATCH /users/:id`): se pasa `groupId` en el body (`"uuid"` para asignar, `null` para remover).
- No existen endpoints dedicados `POST /groups/:id/students` ni `DELETE /groups/:id/students/:userId`.
- `user.entryModule` se calcula **server-side** al asignar/mover:
  - Al asignar a un grupo: `user.entryModule = MIN(group.unlockedModules)` (fallback a `group.entryModule` si `unlockedModules` está vacío). También aplica en `POST /reassignments/:id/resolve`.
  - Al desasignar (`groupId: null`): `user.entryModule = null`.
  - El campo se **ignora si viene en el payload** — nunca es editable por el cliente.

### Publicación Programada

- Las clases pueden tener `publishedAt`. El sistema las publica automáticamente en esa fecha/hora (job cada minuto).
- Si `notify: true` → envía email a todos los estudiantes activos del grupo correspondiente.

### Validación Vimeo

- Al crear o editar una clase, validar que el `vimeoUrl` es accesible antes de persistir.
- Si URL inválido → error descriptivo, no guardar.

---

## API — Requerimientos Funcionales

### Auth

- `POST /auth/login` — email + password, rechaza si estado es `PENDING_ACTIVATION` o `PAUSED`
- `POST /auth/logout` — invalida refresh token del usuario
- `POST /auth/refresh` — rota refresh token → retorna nuevo access token + refresh token
- `GET /auth/me` — perfil del usuario autenticado
- `GET /auth/activate?token=` — valida token de activación, retorna `{ email }`. `404` si no existe, `410` si ya fue usado
- `POST /auth/activate` — body `{ token, name, password }` → activa cuenta, autentica automáticamente
- `POST /auth/password/reset` — solicita reset; envía email solo si el email existe (respuesta siempre 200)
- `POST /auth/password/reset/confirm` — body `{ token, newPassword }` → consume token de reset (12h), actualiza contraseña; `404` si no existe, `410` si expirado/usado
- `POST /auth/password/change` — body `{ currentPassword, newPassword }` (autenticado)

### Usuario actual (`/me`)

- `GET /me` — alias de `GET /auth/me`
- `PATCH /me` — editar nombre, email o contraseña propios
- `GET /me/modules` — módulos desbloqueados para el estudiante autenticado
- `GET /me/classes` — clases visibles (módulos desbloqueados + `isPublished=true` + `publishedAt <= now`)
- `GET /me/progress` — progreso global del estudiante autenticado

### Usuarios (Coach + Teacher en lectura)

- `GET /users` — lista usuarios (filtros: name, email, groupId, status, role) — teacher y coach
- `GET /users/:id` — detalle de usuario — teacher y coach
- `POST /users` — crea usuario (email + role), envía email de activación — coach only
- `PUT /users/:id` — actualizar usuario completo (nombre, email, grupo, status) — coach (todo), teacher (solo estudiantes). `entryModule` **no se acepta** en el payload; se calcula server-side según `groupId`.
- `PATCH /users/:id` — actualización parcial; `groupId` asigna o remueve del grupo — coach y teacher
- `DELETE /users/:id` — eliminación permanente; no se puede eliminar al único coach — coach only
- `GET /users/:id/progress` — todos los registros de Progress del usuario — teacher y coach

### Grupos (Coach; Teacher en lectura)

- `GET /groups` — lista grupos (filtros: nombre, módulo actual) — teacher y coach
- `GET /groups/:id` — detalle con estudiantes asignados — teacher y coach
- `POST /groups` — crear grupo (`name`, `entryModule`, `studentIds[]`) — coach only
- `PUT /groups/:id` — editar grupo (`name`, `entryModule`, `unlockedModules`) — coach only
- `DELETE /groups/:id` — eliminar grupo; falla con `409` si tiene estudiantes asignados — coach only
- `POST /groups/:id/advance` — avanzar al siguiente módulo desbloqueado — coach only
- `POST /groups/:id/retreat` — retroceder un módulo (mínimo = entryModule) — coach only

### Módulos

- `GET /modules` — lista los 9 módulos — student, teacher, coach
- `GET /modules/:number` — detalle de un módulo — student, teacher, coach
- `PUT /modules/:number` — editar título y descripción — coach only

### Clases (Teacher + Coach)

- `GET /classes` — lista clases; query `?moduleNumber=` filtra por módulo — teacher y coach
- `GET /classes/:id` — detalle de clase — student (con verificación de acceso por cohorte), teacher y coach
- `POST /classes` — crear clase (body: `moduleNumber`, `title`, `description`, `vimeoUrl`, `attachments[]`, `publishedAt?`, `notify?`) — teacher y coach
- `PUT /classes/:id` — editar clase completa — teacher y coach
- `PATCH /classes/:id` — edición parcial — teacher y coach
- `DELETE /classes/:id` — eliminar clase — teacher y coach
- `POST /classes/:id/publish` — publicar inmediatamente o programar; `notify=true` envía email a estudiantes activos del grupo — teacher y coach
- `POST /classes/validate-vimeo` — body `{ vimeoUrl }` → `{ valid: bool, message? }` — teacher y coach

### Progreso

- `GET /progress` — query `?userId=&classId=`; student solo puede consultar el propio — student, teacher, coach
- `PUT /progress` — upsert de progreso (`pct`, `lastPositionSec`, `completed`); student solo puede actualizar el propio — student, teacher, coach

### Reasignaciones (solo Coach)

- `GET /reassignments` — cola de reasignaciones con status `PENDING`
- `POST /reassignments/:id/resolve` — body `{ groupId }` → asigna al nuevo grupo, cambia status a `ACTIVE`
- `POST /reassignments/:id/graduate` — marca como `GRADUATED`; acceso solo lectura por 3 meses
- `POST /reassignments/:id/undo` — deshace la última acción; solo una vez (`409` si ya está en `UNDONE`)

### Dashboard y Notificaciones (Coach; Teacher en lectura)

- `GET /dashboard/summary` — métricas: `{ activeStudents, activeGroups, publishedClasses, scheduledClasses, pendingReassignments }`
- `GET /notifications` — reasignaciones pendientes + clases programadas próximas 48h; incluye `{ total, items[] }`

### Salud

- `GET /health` — retorna `{ status: "ok", timestamp }`

---

## Seguridad y Autorización

- **RBAC en middleware** — cada endpoint valida el rol antes de ejecutar el use case.
- **HTTPS obligatorio** — redirigir HTTP a HTTPS. TLS 1.2+.
- **JWT** — access token expira en 15min. Refresh token expira en 30 días y se rota en cada uso.
- **Videos Vimeo** — nunca exponer el link directo. Solo embed. Domain lock activo en Vimeo Pro.
- **Passwords** — almacenar exclusivamente como `passwordHash` (bcrypt, salt rounds: 12). Nunca en texto plano.
- **Env vars** — validación con Zod al arranque. El proceso falla si falta cualquier variable crítica (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `VIMEO_ACCESS_TOKEN`).
- **Recovery emails** — no revelar si el email existe o no (respuesta siempre 200).

---

## Manejo de Errores

### Clases de error tipadas

```typescript
AppError; // base
NotFoundError; // 404
UnauthorizedError; // 401
ForbiddenError; // 403
ValidationError; // 400 — input inválido
BusinessLogicError; // 422 — regla de negocio violada
ConflictError; // 409 — conflicto de estado
```

### Middleware central

- Un solo `errorHandler` en Express captura todas las clases de error.
- Respuesta estándar: `{ error: { code, message, details? } }`
- Todos los errores logueados con Winston en formato JSON.

---

## Integraciones

### SendGrid

- Emails: activación de cuenta, recuperación de contraseña, nueva clase publicada.
- Plantillas con React Email.
- Tasa de éxito objetivo ≥ 95%. Fallos registrados en logs.

### Vimeo

- Validar `vimeoUrl` al crear/editar clase antes de persistir (request a Vimeo API con `VIMEO_ACCESS_TOKEN`).
- Render del embed sin exponer link directo.
- No usar Player API custom en MVP — embed simple con configuración de privacidad.

### Google Drive

- Los adjuntos son links de Drive compartidos guardados como strings.
- El backend **no verifica** disponibilidad del link en tiempo real.
- La responsabilidad de mantener links activos es del administrador.

---

## Requerimientos No Funcionales (Backend)

| NFR                            | Target                                                |
| ------------------------------ | ----------------------------------------------------- |
| API CRUD (p95)                 | < 500 ms                                              |
| Disponibilidad                 | ≥ 99% mensual                                         |
| Grupos simultáneos soportados  | 10+ sin degradación                                   |
| Estudiantes activos soportados | 200+ sin cambio de arquitectura                       |
| Logs                           | Estructurados en JSON (Winston)                       |
| Fallo de Vimeo                 | Clase visible con mensaje, material adjunto accesible |

---

## Convenciones de Desarrollo

- Idioma del sistema: **español** (nombres de variables/código en inglés, mensajes de usuario/email en español).
- Sin E2E en MVP. Sin Sentry en MVP.
- GitHub Actions: lint + type-check + tests + build en cada PR.
- Pre-commit: lint-staged + format (Husky).
- Secuencia de implementación recomendada: **auth → usuarios → grupos → módulos/clases → dashboard**.
- Cobertura de tests unitarios exhaustiva en el servicio de acceso progresivo (lógica de cohortes).
- `.env.example` con placeholders, nunca secrets en el repo.

---

## Fuera de Alcance en MVP

- Límite de sesiones simultáneas por dispositivo (post-MVP)
- OAuth de terceros
- Historial de publicaciones por módulo
- Estadísticas de engagement
- Certificado de completitud
- Integración con WordPress (pagos completamente externos)

---

## Contrato de Respuestas (Frontend)

> Todas las respuestas del backend cumplen el contrato documentado en `frontend-expected-responses.md`. Si vas a agregar un endpoint o modificar uno existente, respeta estas convenciones.

### Envelope obligatorio en listas

Cualquier endpoint que retorna una colección la envuelve en `{ <nombreEntidad>: [...] }`:

| Endpoint                         | Envelope                                      |
| -------------------------------- | --------------------------------------------- |
| `GET /users`                     | `{ users: [] }`                               |
| `GET /users/:id/progress`        | `{ progress: [] }`                            |
| `GET /groups`                    | `{ groups: [] }`                              |
| `GET /modules`                   | `{ modules: [] }`                             |
| `GET /classes`                   | `{ classes: [] }`                             |
| `GET /me/modules`                | `{ modules: [] }`                             |
| `GET /me/classes`                | `{ classes: [] }`                             |
| `GET /me/progress`               | `{ progress: [] }`                            |
| `GET /progress?userId=&classId=` | `{ progress: [record] }` o `{ progress: [] }` |
| `GET /reassignments`             | `{ reassignments: [] }`                       |

Los endpoints que retornan un objeto único (`GET /users/:id`, `GET /groups/:id`, `GET /auth/me`, `GET /me`, mutaciones, etc.) devuelven el objeto directamente **sin envelope**.

### Shape de `Class`

Toda respuesta de clase (incluyendo `/me/classes` para estudiantes) incluye estos campos, aunque algunos se envían con **defaults hardcodeados** porque el schema aún no los soporta:

```ts
{
  id, moduleId, moduleNumber, title, description,
  kind: 'VIDEO',              // default
  vimeoUrl,                   // siempre presente (también para STUDENT)
  embedUrl,                   // computed https://player.vimeo.com/video/{id}
  complementText: '',         // default
  textBody: null,             // default
  attachments: [{ name, url }],
  publishedAt, isPublished,
  scheduled,                  // computed: !isPublished && publishedAt !== null
  durationMin: null,          // default
  notify, createdAt, updatedAt,
}
```

Si en el futuro se agregan `kind`, `complementText`, `textBody` o `durationMin` al schema, reemplazar los defaults por la lectura real.

### Shape de `Group`

Todas las respuestas de grupo (list/get/create/update/advance/retreat) incluyen `students` como array mínimo `[{ id }]`. El frontend mapea `students[].id → studentIds[]`; no envía info adicional del usuario.

Implementación:

- `findMany` incluye `students: { select: { id: true } }`.
- Tras mutaciones (`create`/`update`/`advance`/`retreat`) se llama `groupRepo.findStudentIds(id)` para poblar el array.

### Shape de `Reassignment` — plano

`GET /reassignments` y las mutaciones (`resolve`/`graduate`/`undo`) devuelven objetos con campos **planos**, no anidados:

```ts
{
  (id, userId, userName, status, createdAt);
}
```

- `userName` = `user.name ?? user.email` (fallback al email si el nombre es null).
- Las mutaciones devuelven el objeto de la reasignación actualizada, **no** `{ message }`.
- Nuevo helper de repo: `findByIdWithUser(id)` que hace el include del user tras la mutación.

### Shape de `NotificationItem` — discriminado por tipo

```ts
type NotificationItem =
  | { type: 'REASSIGNMENT'; createdAt; reassignmentId; userName }
  | { type: 'SCHEDULED_CLASS'; createdAt; classId; classTitle; scheduledAt };
```

No usar campos genéricos `id`/`message`. El frontend accede a los campos específicos según `type`.

### Login / Activate — user completo

`POST /auth/login` y `POST /auth/activate` devuelven `{ accessToken, refreshToken, user }` con:

```ts
user: {
  (id, email, name, role, status, groupId, entryModule);
}
```

`groupId` y `entryModule` son `null` para roles no-estudiante.

### Enums en UPPERCASE

`role` y `status` (de usuarios) y `status` de reasignaciones se envían en **UPPERCASE** en las responses. El frontend normaliza a lowercase internamente.

### ⚠️ Pendiente: request payloads en lowercase

El frontend envía `role` y `status` en `POST /users` y `PUT /users/:id` en **lowercase**, pero el backend (Zod + Prisma enum) espera UPPERCASE. Esto rompe requests, no responses. Solución: agregar `.transform(s => s.toUpperCase())` en los DTOs afectados, o coordinar con el frontend.

---

## Estado de Implementación

> Última revisión: 2026-08-25

El backend está **completamente implementado** y compila sin errores (`tsc --noEmit` limpio). Tests: 145/145 pasan.

### Qué está construido

| Capa                                           | Estado          |
| ---------------------------------------------- | --------------- |
| Dominio (entidades, value objects, interfaces) | ✅ Completo     |
| Use cases (application layer)                  | ✅ Completo     |
| Repositorios Prisma (infrastructure)           | ✅ Completo     |
| Controllers + Routes + DTOs                    | ✅ Completo     |
| Middleware (auth, RBAC, errorHandler)          | ✅ Completo     |
| Job de publicación programada (cada minuto)    | ✅ Implementado |
| SendGrid adapter                               | ✅ Implementado |
| Vimeo adapter (validación de URL)              | ✅ Implementado |
| Rate limiting en endpoints de auth             | ✅ Implementado |
| Tests unitarios (use cases y dominio)          | ✅ Implementado |

### Para correr el proyecto

1. Copiar `.env.example` a `.env` y completar variables
2. `npx prisma migrate deploy` (o `prisma db push` en dev)
3. `npm run dev`

Variables requeridas: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `VIMEO_ACCESS_TOKEN`, `FRONTEND_URL`

### Documentación de endpoints

- `docs/api-endpoints.md` — referencia completa de endpoints con requests y responses.
- `frontend-expected-responses.md` — contrato exacto que los servicios del frontend esperan recibir. **Fuente de verdad para el shape de las responses.**

---

## Habilidades Disponibles (`.agents/skills`)

Skills preinstaladas en este repo. Invócalas con `/` o referencialas en prompts para contexto adicional.

| Skill                       | Cuándo usar en este repo                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `nodejs-express-server`     | Crear controllers, routes, middleware chains, setup del servidor Express, error handling middleware |
| `nodejs-backend-patterns`   | Implementar DDD: use cases, repository pattern, domain services, value objects                      |
| `nodejs-best-practices`     | Revisión de calidad de código Node.js, async/await, manejo de errores                               |
| `emailAndPassword`          | Flujo de auth: login, activación de cuenta, reset de contraseña, bcrypt                             |
| `prisma-cli`                | Correr migraciones (`prisma migrate dev`), `prisma generate`, `prisma db push`, `prisma studio`     |
| `prisma-client-api`         | Escribir queries Prisma, transacciones atómicas, relaciones, filtros avanzados                      |
| `prisma-database-setup`     | Setup inicial del schema Prisma con PostgreSQL/Supabase                                             |
| `prisma-postgres`           | Configuración Prisma + PostgreSQL (Supabase connection string, pooling)                             |
| `typescript-advanced-types` | Types complejos, generics, branded types, utility types, discriminated unions                       |
| `vitest`                    | Unit tests de dominio, integration tests, mocking de repositorios y servicios                       |
| `zod`                       | Schemas de validación para DTOs, variables de entorno, input validation en controllers              |
| `organization`              | Estructura de carpetas DDD, barrel exports, nombrado de módulos                                     |
| `best-practices`            | Revisión general de buenas prácticas antes de merge                                                 |

### Cuándo activar cada skill

```
Implementando un endpoint         → nodejs-express-server + nodejs-backend-patterns
Escribiendo un use case           → nodejs-backend-patterns
Validando DTOs / env vars         → zod
Definiendo/migrando el schema     → prisma-cli + prisma-database-setup
Escribiendo queries complejas     → prisma-client-api
Implementando auth                → emailAndPassword + nodejs-express-server
Escribiendo tests                 → vitest
Revisando código antes de merge   → best-practices + nodejs-best-practices
Tipos TypeScript complejos        → typescript-advanced-types
```
