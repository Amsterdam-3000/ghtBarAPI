import { Request } from 'express';
import { User } from '@prisma/client';

import { PrismaClientExtended } from '../prisma/prisma';

export interface IAppContext {
  prisma: PrismaClientExtended;
  user: User;
  req: Request;
}
