import { checkStudentStatus } from './checkStudentStatus';
import { PrismaUserRepository } from '@infrastructure/persistence/prisma/PrismaUserRepository';

export const studentCheck = checkStudentStatus(new PrismaUserRepository());
