import { User } from '@prisma/client';
import { PrismaClient } from '../prisma/prisma.service';

export interface IAppContext {
  prisma: PrismaClient;
  user: User;
}
