import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import winston from 'winston';

const log = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

log.info('Script iniciado');
log.info(
  `DATABASE_URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':[HIDDEN]@') : 'NO DEFINIDA'}`
);
log.info(
  `DIRECT_URL:   ${process.env.DIRECT_URL ? process.env.DIRECT_URL.replace(/:([^:@]+)@/, ':[HIDDEN]@') : 'NO DEFINIDA'}`
);

const prisma = new PrismaClient();
log.info('PrismaClient instanciado');

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

const VIMEO = 'https://vimeo.com/76979871';
const ATTACHMENTS = [
  { name: 'Cuaderno de trabajo', url: 'https://drive.google.com/file/d/placeholder-cuaderno/view' },
  { name: 'Audio de práctica', url: 'https://drive.google.com/file/d/placeholder-audio/view' },
];

async function main() {
  log.info('Conectando a la base de datos...');
  try {
    await prisma.$connect();
    log.info('Conexión exitosa');
  } catch (e) {
    log.error(`Fallo de conexión: ${e}`);
    throw e;
  }

  log.info('Limpiando datos existentes...');
  try {
    await prisma.progress.deleteMany();
    await prisma.reassignment.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.activationToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.class.deleteMany();
    await prisma.module.deleteMany();
    await prisma.group.deleteMany();
    log.info('Datos eliminados');
  } catch (e) {
    log.error(`Error al limpiar: ${e}`);
    throw e;
  }

  const passwordHash = await bcrypt.hash('ccp2026', 12);

  // ─── Grupos ────────────────────────────────────────────────────────
  log.info('Creando grupos...');

  const [g1, g2] = await Promise.all([
    // Génesis: ciclo completo — los alumnos en reasignación vienen de acá
    prisma.group.create({
      data: { name: 'Grupo Génesis', entryModule: 1, unlockedModules: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    }),
    // Amanecer: a mitad del ciclo
    prisma.group.create({
      data: { name: 'Grupo Amanecer', entryModule: 3, unlockedModules: [3, 4] },
    }),
  ]);
  log.info('Grupos creados: 2');

  // ─── Usuarios ──────────────────────────────────────────────────────
  log.info('Creando usuarios...');

  const mkStudent = (
    email: string,
    name: string,
    groupId?: string,
    entryModule?: number,
    status: 'ACTIVE' | 'PAUSED' | 'PENDING_REASSIGNMENT' = 'ACTIVE'
  ) =>
    prisma.user.create({
      data: { email, name, role: 'STUDENT', status, passwordHash, groupId, entryModule },
    });

  const [
    _coach,
    _teacher1,
    _teacher2,
    sLaura,
    sSantiago,
    sValentina, // PENDING_ACTIVATION — sin nombre ni contraseña aún
    _sDiego, // PAUSED
    sMariana,
    sAndresMora, // PENDING_REASSIGNMENT
    sLauraRios, // PENDING_REASSIGNMENT
  ] = await Promise.all([
    // Staff
    prisma.user.create({
      data: {
        email: 'coach@ccp.co',
        name: 'María Restrepo',
        role: 'COACH',
        status: 'ACTIVE',
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'andres@ccp.co',
        name: 'Andrés Vélez',
        role: 'TEACHER',
        status: 'ACTIVE',
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'camila.h@ccp.co',
        name: 'Camila Herrera',
        role: 'TEACHER',
        status: 'ACTIVE',
        passwordHash,
      },
    }),
    // Estudiantes
    mkStudent('laura@ejemplo.com', 'Laura Gómez', g1.id, 1),
    mkStudent('santiago@ejemplo.com', 'Santiago Ruiz', g1.id, 1),
    // Aún no activó — el coach acaba de crear la cuenta
    prisma.user.create({
      data: { email: 'valentina@ejemplo.com', role: 'STUDENT', status: 'PENDING_ACTIVATION' },
    }),
    mkStudent('diego@ejemplo.com', 'Diego Torres', g2.id, 3, 'PAUSED'),
    mkStudent('mariana@ejemplo.com', 'Mariana Castaño', g2.id, 3),
    mkStudent('andres.mora@ejemplo.com', 'Andrés Mora', g1.id, 3, 'PENDING_REASSIGNMENT'),
    mkStudent('laura.rios@ejemplo.com', 'Laura Ríos', g1.id, 1, 'PENDING_REASSIGNMENT'),
  ]);
  log.info('Usuarios creados: 10');

  // Token de activación para Valentina (link pendiente de clic)
  await prisma.activationToken.create({
    data: { userId: sValentina.id, token: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
  });
  log.info('Token de activación creado');

  // ─── Módulos ───────────────────────────────────────────────────────
  log.info('Creando módulos...');

  const [m1, m2, m3, m4, m5, m6, m7, m8, m9] = await Promise.all([
    prisma.module.create({
      data: {
        number: 1,
        title: 'Fundamentos de la consciencia',
        description: 'El punto de partida — quién eres realmente bajo las narrativas heredadas.',
      },
    }),
    prisma.module.create({
      data: {
        number: 2,
        title: 'Identificación y desidentificación',
        description: 'Reconocer las identidades adquiridas y crear espacio entre tú y ellas.',
      },
    }),
    prisma.module.create({
      data: {
        number: 3,
        title: 'Emociones como mensajeras',
        description: 'Decodificar el lenguaje emocional sin reprimir ni reaccionar.',
      },
    }),
    prisma.module.create({
      data: {
        number: 4,
        title: 'El cuerpo como aliado',
        description: 'La sabiduría somática y la regulación del sistema nervioso.',
      },
    }),
    prisma.module.create({
      data: {
        number: 5,
        title: 'Patrones relacionales',
        description: 'Cómo se repiten los vínculos y cómo se rompe el ciclo.',
      },
    }),
    prisma.module.create({
      data: {
        number: 6,
        title: 'Propósito y vocación',
        description: 'La diferencia entre lo que te exige el mundo y lo que te llama.',
      },
    }),
    prisma.module.create({
      data: {
        number: 7,
        title: 'Disciplina sin violencia',
        description: 'Construir hábitos sostenibles desde el amor propio.',
      },
    }),
    prisma.module.create({
      data: {
        number: 8,
        title: 'Comunidad y pertenencia',
        description: 'El tejido humano necesario para sostener la transformación.',
      },
    }),
    prisma.module.create({
      data: {
        number: 9,
        title: 'Integración y siguiente ciclo',
        description:
          'Llevar lo aprendido a la vida cotidiana y prepararse para el siguiente nivel.',
      },
    }),
  ]);
  log.info('Módulos creados: 9');

  // ─── Clases ────────────────────────────────────────────────────────
  log.info('Creando clases...');

  const mkClass = (
    moduleId: string,
    title: string,
    opts: {
      publishedAt?: Date | null;
      isPublished?: boolean;
      notify?: boolean;
      description?: string;
    } = {}
  ) =>
    prisma.class.create({
      data: {
        moduleId,
        title,
        description: opts.description ?? 'Sesión en vivo grabada del programa CCP.',
        vimeoUrl: VIMEO,
        attachments: ATTACHMENTS,
        isPublished: opts.isPublished ?? true,
        publishedAt: opts.publishedAt !== undefined ? opts.publishedAt : new Date(),
        notify: opts.notify ?? true,
      },
    });

  const [
    c1_1,
    c1_2,
    c1_3,
    _c2_1,
    _c2_2,
    c3_1,
    c3_2,
    _c3_3,
    _c4_1,
    _c4_2,
    _c5_1,
    _c6_1,
    _c7_1,
    _c8_1,
    c9_1,
  ] = await Promise.all([
    // Módulo 1
    mkClass(m1.id, 'Bienvenida al CCP — el mapa del proceso', { publishedAt: daysAgo(14) }),
    mkClass(m1.id, 'El observador interno', { publishedAt: daysAgo(9) }),
    mkClass(m1.id, 'Práctica: respiración y presencia', { publishedAt: daysAgo(4) }),
    // Módulo 2
    mkClass(m2.id, 'El yo que crees ser', { publishedAt: daysAgo(12) }),
    mkClass(m2.id, 'Las máscaras heredadas', { publishedAt: daysAgo(6) }),
    // Módulo 3
    mkClass(m3.id, 'Cartografía emocional', { publishedAt: daysAgo(12) }),
    mkClass(m3.id, 'Las cinco emociones raíz', { publishedAt: daysAgo(7) }),
    mkClass(m3.id, 'Práctica: nombrar lo que se siente', { publishedAt: daysAgo(2) }),
    // Módulo 4
    mkClass(m4.id, 'La inteligencia del cuerpo', { publishedAt: daysAgo(18) }),
    mkClass(m4.id, 'Regulación del sistema nervioso', { publishedAt: daysAgo(10) }),
    // Módulo 5
    mkClass(m5.id, 'Vínculos espejo', { publishedAt: daysAgo(8) }),
    // Módulo 6
    mkClass(m6.id, 'Llamado vs. expectativa', { publishedAt: daysAgo(6) }),
    // Módulo 7
    mkClass(m7.id, 'Disciplina sin látigo', { publishedAt: daysAgo(10) }),
    // Módulo 8
    mkClass(m8.id, 'Pertenencia consciente', { publishedAt: daysAgo(11) }),
    // Módulo 9
    mkClass(m9.id, 'Integración y cierre', { publishedAt: daysAgo(20) }),
    // Borrador en M3 — sin publicar
    mkClass(m3.id, 'Sesión sin publicar — borrador', {
      isPublished: false,
      publishedAt: null,
      notify: false,
    }),
    // Programada — el job la publica automáticamente
    mkClass(m4.id, 'Sesión en vivo: Q&A energía vital', {
      isPublished: false,
      publishedAt: daysFromNow(3),
      notify: true,
    }),
  ]);
  log.info('Clases creadas: 17');

  // ─── Progreso ──────────────────────────────────────────────────────
  log.info('Creando registros de progreso...');

  await Promise.all([
    // Laura Gómez (g1, M1): M1 completado
    prisma.progress.create({
      data: {
        userId: sLaura.id,
        classId: c1_1.id,
        pct: 1.0,
        lastPositionSec: 3200,
        completed: true,
      },
    }),
    prisma.progress.create({
      data: {
        userId: sLaura.id,
        classId: c1_2.id,
        pct: 1.0,
        lastPositionSec: 2900,
        completed: true,
      },
    }),
    prisma.progress.create({
      data: {
        userId: sLaura.id,
        classId: c1_3.id,
        pct: 1.0,
        lastPositionSec: 3050,
        completed: true,
      },
    }),
    // Santiago Ruiz (g1, M1): M1 en progreso
    prisma.progress.create({
      data: {
        userId: sSantiago.id,
        classId: c1_1.id,
        pct: 1.0,
        lastPositionSec: 3000,
        completed: true,
      },
    }),
    prisma.progress.create({
      data: {
        userId: sSantiago.id,
        classId: c1_2.id,
        pct: 0.55,
        lastPositionSec: 1540,
        completed: false,
      },
    }),
    // Mariana Castaño (g2, M3–M4): M3 en progreso
    prisma.progress.create({
      data: {
        userId: sMariana.id,
        classId: c3_1.id,
        pct: 1.0,
        lastPositionSec: 3100,
        completed: true,
      },
    }),
    prisma.progress.create({
      data: {
        userId: sMariana.id,
        classId: c3_2.id,
        pct: 0.7,
        lastPositionSec: 1400,
        completed: false,
      },
    }),
    // Andrés Mora y Laura Ríos — completaron M9
    prisma.progress.create({
      data: {
        userId: sAndresMora.id,
        classId: c9_1.id,
        pct: 1.0,
        lastPositionSec: 3600,
        completed: true,
      },
    }),
    prisma.progress.create({
      data: {
        userId: sLauraRios.id,
        classId: c9_1.id,
        pct: 1.0,
        lastPositionSec: 3500,
        completed: true,
      },
    }),
  ]);
  log.info('Registros de progreso creados: 9');

  // ─── Reasignaciones ────────────────────────────────────────────────
  log.info('Creando reasignaciones pendientes...');

  await Promise.all([
    prisma.reassignment.create({ data: { userId: sAndresMora.id, status: 'PENDING' } }),
    prisma.reassignment.create({ data: { userId: sLauraRios.id, status: 'PENDING' } }),
  ]);
  log.info('Reasignaciones creadas: 2');

  log.info('━━━ Seed completado exitosamente ━━━');
  log.info('Credenciales (contraseña: ccp2026):');
  log.info('  Coach:    coach@ccp.co');
  log.info('  Teacher:  andres@ccp.co');
  log.info('  Teacher:  camila.h@ccp.co');
  log.info('  Student:  laura@ejemplo.com      → Génesis  M1 (ACTIVE, M1 completado)');
  log.info('  Student:  santiago@ejemplo.com   → Génesis  M1 (ACTIVE, M1 en progreso)');
  log.info('  Student:  valentina@ejemplo.com  → sin grupo (PENDING_ACTIVATION)');
  log.info('  Student:  diego@ejemplo.com      → Amanecer M3 (PAUSED)');
  log.info('  Student:  mariana@ejemplo.com    → Amanecer M3 (ACTIVE, M3 en progreso)');
  log.info('  Student:  andres.mora@ejemplo.com → Génesis (PENDING_REASSIGNMENT)');
  log.info('  Student:  laura.rios@ejemplo.com  → Génesis (PENDING_REASSIGNMENT)');
}

main()
  .catch((e) => {
    log.error(`Seed fallido: ${e}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
