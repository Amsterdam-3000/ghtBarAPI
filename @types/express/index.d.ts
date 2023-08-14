import { User as PrismaUser } from '@prisma/client';
import { PrismaClientExtended } from '../../src/prisma/prisma';

declare global {
  namespace Express {
    interface User extends PrismaUser {}

    interface Request {
      user: PrismaUser;
      prisma: PrismaClientExtended;
    }
  }
}
