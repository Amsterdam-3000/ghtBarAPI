import { NextFunction, Request, Response } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

import { ThrottlerGuard } from './throttler.guard';

@Injectable()
export class ThrottlerMiddleware implements NestMiddleware {
  constructor(private throttlerProxyGuard: ThrottlerGuard) {}

  async use(req: Request, res: Response, next: NextFunction) {
    await this.throttlerProxyGuard.canActivate(
      new ExecutionContextHost([req, res, next], ThrottlerMiddleware, this.use),
    );
    next();
  }
}
