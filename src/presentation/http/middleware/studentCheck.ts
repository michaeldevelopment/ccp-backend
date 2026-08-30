import { checkStudentStatus } from './checkStudentStatus';
import { PrismaUserRepository } from '@infrastructure/persistence/prisma/PrismaUserRepository';
import { PrismaReassignmentRepository } from '@infrastructure/persistence/prisma/PrismaReassignmentRepository';

export const studentCheck = checkStudentStatus(
  new PrismaUserRepository(),
  new PrismaReassignmentRepository()
);
