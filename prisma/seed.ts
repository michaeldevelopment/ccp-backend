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

const COACH_EMAIL = 'coachingonlyone@gmail.com';
const COACH_PASSWORD = 'MauroyCata2026!';
const STUDENT_EMAIL = 'estudiante.prueba@gmail.com';
const STUDENT_PASSWORD = 'ccp2026';

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

  // ─── Usuarios ──────────────────────────────────────────────────────
  log.info('Creando usuarios...');

  const [coachHash, studentHash] = await Promise.all([
    bcrypt.hash(COACH_PASSWORD, 12),
    bcrypt.hash(STUDENT_PASSWORD, 12),
  ]);

  await Promise.all([
    prisma.user.create({
      data: {
        email: COACH_EMAIL,
        name: 'Mauro Barrientos',
        role: 'COACH',
        status: 'ACTIVE',
        passwordHash: coachHash,
      },
    }),
    prisma.user.create({
      data: {
        email: STUDENT_EMAIL,
        name: 'Estudiante de Prueba',
        role: 'STUDENT',
        status: 'ACTIVE',
        passwordHash: studentHash,
      },
    }),
  ]);
  log.info('Usuarios creados: 2');

  // ─── Módulos ───────────────────────────────────────────────────────
  // Solo los 3 primeros: el coach crea los que falten con POST /modules
  // (el programa admite hasta 9).
  log.info('Creando módulos...');

  await prisma.module.createMany({
    data: [
      {
        number: 1,
        title: 'Fundamentos de la consciencia',
        description: 'El punto de partida — quién eres realmente bajo las narrativas heredadas.',
      },
      {
        number: 2,
        title: 'Identificación y desidentificación',
        description: 'Reconocer las identidades adquiridas y crear espacio entre tú y ellas.',
      },
      {
        number: 3,
        title: 'Emociones como mensajeras',
        description: 'Decodificar el lenguaje emocional sin reprimir ni reaccionar.',
      },
    ],
  });
  log.info('Módulos creados: 3');

  log.info('━━━ Seed completado exitosamente ━━━');
  log.info('Credenciales:');
  log.info(`  Coach:    ${COACH_EMAIL} / ${COACH_PASSWORD}`);
  log.info(`  Student:  ${STUDENT_EMAIL} / ${STUDENT_PASSWORD} (sin grupo asignado)`);
}

main()
  .catch((e) => {
    log.error(`Seed fallido: ${e}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
