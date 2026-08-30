# RULES — CCP Backend

Constraints y criterios críticos derivados de `CLAUDE.md` y `BACKEND_SPEC.md`. Toda implementación debe cumplirlos sin excepción.

---

## 1. Arquitectura DDD — Reglas de Capas

- **Presentation** solo habla con **Application**. Nunca importa repositorios ni accede a Prisma directamente.
- **Application** (use cases) orquesta el flujo. No contiene lógica de dominio.
- **Domain** no importa nada de infraestructura. Zero dependencias externas.
- **Infrastructure** implementa las interfaces definidas en Domain.
- Los repositorios en `domain/*/repositories/` son **interfaces** (contratos), no implementaciones.
- Las implementaciones de repositorios van en `infrastructure/persistence/prisma/`.
- Un use case = un archivo. Un use case hace una sola cosa.

```
Presentation → Application → Domain ← Infrastructure
```

## 2. Seguridad — Reglas Irrompibles

- **NUNCA** guardar password en texto plano. Siempre `bcrypt.hash()` → `passwordHash`.
- **NUNCA** exponer el link directo de Vimeo. Solo el embed. Domain lock en Vimeo Pro.
- **NUNCA** revelar si un email existe o no en `POST /auth/forgot-password` (respuesta siempre 200).
- **NUNCA** commitear secrets. Solo `.env.example` con placeholders va al repo.
- Los env vars críticos (`DATABASE_URL`, `JWT_SECRET`, `SENDGRID_API_KEY`, `VIMEO_TOKEN`) deben validarse con Zod al arranque. Si falta uno, el proceso **falla**.
- JWT en headers. Sin refresh token en MVP.
- RBAC en middleware antes de ejecutar el use case. Los controllers no validan roles.

## 3. Modelo de Dominio — Invariantes

### Roles

| Rol                  | Constante   |
| -------------------- | ----------- |
| Admin total          | `COACH`     |
| Gestión de contenido | `PROFESSOR` |
| Solo su cohorte      | `STUDENT`   |

### Estados válidos por rol

- `STUDENT`: `PENDING_ACTIVATION` → `ACTIVE` → `PAUSED` / `GRADUATED` / `PENDING_REASSIGNMENT`
- `PROFESSOR`: `PENDING_ACTIVATION` → `ACTIVE` → `PAUSED`
- `GRADUATED` y `PENDING_REASSIGNMENT` son **exclusivos de estudiantes**. Retornar `400` si se asignan a un profesor.

### Usuario en `PENDING_ACTIVATION`

- No puede hacer login.
- No puede asignarse a un grupo.
- Solo acción disponible: eliminarlo.
- `name` y `passwordHash` son `null` en BD hasta activación.

### ActivationToken

- Un solo uso. `usedAt !== null` → ya consumido → `410 Gone`.
- Sin expiración (el Coach elimina y recrea la cuenta si el link se pierde).

### PasswordResetToken

- Expira en 12 horas.

## 4. Acceso Progresivo — Núcleo del Sistema

Un estudiante accede SOLO a clases que cumplan **todas** estas condiciones:

1. El módulo está en el rango `[group.entryModule, group.currentModule]` (inclusive).
2. El módulo ha sido desbloqueado por el Coach para ese grupo.
3. La clase está publicada (`isPublished = true` y `publishedAt <= now`).

Consecuencias directas:

- Módulos anteriores a `entryModule`: **invisibles**.
- Módulos futuros (no desbloqueados): **invisibles**.
- Clases de módulos accesibles: todas disponibles (incluidas anteriores, para repaso).

Este servicio requiere **cobertura de tests exhaustiva**.

## 5. Fin de Ciclo — Módulo 9

Al completar módulo 9:

- Si `entryModule > 1` → estado pasa a `PENDING_REASSIGNMENT`.
- Si `entryModule == 1` → el Coach puede marcarlo manualmente como `GRADUATED`.
- `GRADUATED` da acceso solo lectura por 3 meses.

## 6. Asignación a Grupos

No existen endpoints `POST /groups/:id/students` ni `DELETE /groups/:id/students/:userId`.

La asignación se maneja via:

- `POST /groups` — body acepta `studentIds[]`, el backend actualiza `groupId` en cada usuario.
- `PATCH /users/:id` — `{ "groupId": "uuid" }` para asignar, `{ "groupId": null }` para desasignar.
- `POST /reassignments/:id/resolve` — internamente usa el mismo mecanismo de `PATCH /users/:id`.

## 7. Validación Vimeo

Al crear o editar una clase:

1. Validar que el embed de Vimeo es accesible **antes** de persistir.
2. Si es inválido → retornar error descriptivo, no guardar.
3. Nunca guardar un link directo. Solo el embed HTML.

Si Vimeo falla en runtime: la clase permanece visible con mensaje de error, los adjuntos siguen accesibles.

## 8. Publicación Programada

- Clases con `scheduledAt` futuro se publican automáticamente (job con `node-cron`).
- Si `notifyStudents: true` → email a todos los estudiantes `ACTIVE` del grupo correspondiente.
- Fallos de email se registran en logs (Winston) pero no interrumpen el flujo.

## 9. API — Formato de Respuestas

### Errores (siempre JSON estructurado)

```json
{ "error": { "code": "NOT_FOUND", "message": "...", "details": {} } }
```

### Clases de error tipadas

| Clase                | HTTP |
| -------------------- | ---- |
| `ValidationError`    | 400  |
| `UnauthorizedError`  | 401  |
| `ForbiddenError`     | 403  |
| `NotFoundError`      | 404  |
| `BusinessLogicError` | 422  |

Un solo `errorHandler` middleware en Express captura todos. Todos los errores se loguean con Winston en JSON.

## 10. Convenciones de Código

- **Código/variables**: inglés.
- **Mensajes de usuario y emails**: español.
- Sin comentarios que expliquen QUÉ hace el código. Solo comentar el POR QUÉ si no es obvio.
- Sin docstrings multi-línea.
- `passwordHash` es el nombre del campo en BD. En DTOs el campo del formulario es `password`.
- Adjuntos de Google Drive: strings (links compartidos). El backend **no verifica** disponibilidad.

## 11. Tests

- Sin E2E en MVP.
- Cobertura **exhaustiva** del servicio de acceso progresivo (lógica de cohortes).
- Framework: Vitest.
- Los tests de dominio no tocan infraestructura (no Prisma, no HTTP).

## 12. Fuera de Alcance en MVP

No implementar bajo ninguna circunstancia:

- Refresh tokens
- OAuth de terceros
- Límite de sesiones por dispositivo
- Historial de publicaciones por módulo
- Estadísticas de engagement
- Certificado de completitud
- Marcado de clases vistas por estudiante
- Integración con WordPress
- Sentry
