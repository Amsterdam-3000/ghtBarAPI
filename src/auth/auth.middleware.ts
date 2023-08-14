import { NextFunction, Request, Response } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

import { AuthJwtGuard } from './auth.jwt.guard';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private guard: AuthJwtGuard) {}

  async use(req: Request, res: Response, next: NextFunction) {
    await this.guard.canActivate(new ExecutionContextHost([req, res, next]));
    next();
  }
}
