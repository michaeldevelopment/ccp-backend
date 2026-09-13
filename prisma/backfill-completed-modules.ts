import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

const log = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

const prisma = new PrismaClient();

async function main() {
  log.info('Backfill de completedModules iniciado');

  const classesByModule = await prisma.class.findMany({
    where: { isPublished: true },
    select: { id: true, module: { select: { number: true } } },
  });

  const publishedByModule = new Map<number, Set<string>>();
  for (const c of classesByModule) {
    const set = publishedByModule.get(c.module.number) ?? new Set<string>();
    set.add(c.id);
    publishedByModule.set(c.module.number, set);
  }

  const users = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, email: true, completedModules: true },
  });

  log.info(`Evaluando ${users.length} estudiantes contra ${publishedByModule.size} módulos`);

  let touched = 0;
  for (const user of users) {
    const progressRows = await prisma.progress.findMany({
      where: { userId: user.id, completed: true },
      select: { classId: true },
    });
    const completedClassIds = new Set(progressRows.map((p) => p.classId));

    const completedModules: number[] = [];
    for (const [moduleNumber, publishedIds] of publishedByModule.entries()) {
      if (publishedIds.size === 0) continue;
      const allDone = [...publishedIds].every((id) => completedClassIds.has(id));
      if (allDone) completedModules.push(moduleNumber);
    }

    const current = new Set(user.completedModules);
    const target = new Set(completedModules);
    const diff = completedModules.filter((m) => !current.has(m));
    const same = current.size === target.size && [...current].every((m) => target.has(m));
    if (same) continue;

    await prisma.user.update({
      where: { id: user.id },
      data: { completedModules: completedModules.sort((a, b) => a - b) },
    });
    touched += 1;
    log.info(
      `${user.email}: [${[...current].sort().join(',')}] → [${completedModules.sort((a, b) => a - b).join(',')}]${diff.length ? ` (nuevos: ${diff.join(',')})` : ''}`
    );
  }

  log.info(`Backfill terminado. Usuarios actualizados: ${touched}/${users.length}`);
}

main()
  .catch((err) => {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
