# CCP Platform — Backend

Plataforma privada de e-learning para el programa CCP de Only One Coaching.
9 módulos en 3 semestres con acceso progresivo por cohorte y clases en Vimeo.
Tres roles: Coach (admin), Teacher (contenido), Student (acceso por grupo).

## Stack

Node.js + TypeScript · Express · DDD · Prisma + PostgreSQL (Supabase) · Zod · Bcrypt · JWT · SendGrid + React Email · Winston · Vitest · ESLint/Prettier/Husky.

**Infra:** Backend en Railway · DB en Supabase · Email por SendGrid · Video en Vimeo Pro (domain lock) · Adjuntos como links de Google Drive.

## Comandos

```bash
npm run dev              # dev server (tsx watch)
npm run build            # compilar TS
npm run start            # correr build
npm run test             # vitest
npm run lint             # eslint
npx prisma migrate dev   # migración local
npx prisma db push       # push schema (dev rápido)
npx prisma studio        # DB browser
```

Env vars requeridas (validadas con Zod al arranque, el proceso falla si falta cualquiera):
`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_TEMPLATE_ID`, `VIMEO_ACCESS_TOKEN`, `FRONTEND_URL`.

## Reglas no negociables

- **Acceso progresivo** — un estudiante solo ve clases entre su `user.entryModule` (congelado al ingresar al grupo) y el módulo actual del grupo. Nunca módulos anteriores a su `entryModule` ni futuros no desbloqueados.
- **`entryModule` es server-side** — se calcula al asignar grupo (`MIN(unlockedModules)`, fallback a `group.entryModule`). Se ignora si llega en el payload. Nunca editable por el cliente.
- **Passwords** — solo `passwordHash` (bcrypt, salt rounds 12). Nunca texto plano, nunca otro campo.
- **JWT** — access token 15 min, refresh token 30 días **rotado en cada uso**.
- **Videos Vimeo** — nunca exponer link directo, solo embed. Validar `vimeoUrl` con la API de Vimeo antes de persistir.
- **RBAC en middleware** — cada endpoint valida el rol antes del use case.
- **HTTPS obligatorio** — TLS 1.2+, redirect HTTP→HTTPS.
- **Recovery emails no revelan existencia** — `POST /auth/password/reset` siempre responde 200.
- **Errores** — usar clases tipadas (`NotFoundError`, `ValidationError`, etc.) y dejar que el `errorHandler` central responda. Nunca `res.status(500).json(...)` a mano.
- **Idioma** — código en inglés, mensajes de usuario y emails en español.

## Dónde está lo demás

**`.claude/context/`** — información del proyecto que Claude debe conocer para tomar decisiones:

- `business.md` — dominio, entidades, estados, reglas de negocio detalladas
- `functional-requirements.md` — todos los endpoints de la API con roles
- `non-functional-requirements.md` — targets de performance, disponibilidad, escala
- `out-of-scope.md` — qué NO se implementa en el MVP
- `implementation-status.md` — qué está construido y cómo correr el proyecto

**`.claude/memory/`** — convenciones y contratos que ya están decididos:

- `integrations.md` — SendGrid, Vimeo, Google Drive
- `response-envelopes.md` — qué endpoints envuelven listas y cuáles no
- `entity-shapes.md` — shape exacta de Class, Group, Reassignment, Notification, User en responses
- `error-handling.md` — clases tipadas y shape de respuesta de error
- `conventions.md` — estructura DDD, idioma, secuencia de implementación
- `skills-guide.md` — skills preinstaladas y cuándo activarlas

**Docs de referencia:**

- `docs/api-endpoints.md` — endpoints con requests/responses completos
- `frontend-expected-responses.md` — contrato exacto que consume el frontend (fuente de verdad de shapes)

> **Migración en curso:** durante todo el proceso de migración del modelo lineal → cíclico, leer `MIGRACIONES.md` antes de tocar schema, use cases o lógica de acceso. Contiene el estado actual, fases completadas y decisiones tomadas.
