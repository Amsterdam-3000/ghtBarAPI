import { Request } from 'express';
import {
  ThrottlerGuard as ThrottlerGuardBase,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { LoggerService } from '../logger/logger.service';

@Injectable()
export class ThrottlerGuard extends ThrottlerGuardBase {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private logger: LoggerService,
  ) {
    super(options, storageService, reflector);
    this.logger.setContext(ThrottlerGuard.name);
  }

  protected handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    this.logger
      .setReq(context.switchToHttp().getRequest())
      .log(`Handled for limit:${limit} ttl:${ttl}`);

    return super.handleRequest(context, limit, ttl);
  }

  protected getTracker(req: Request) {
    return req.ips.length ? req.ips[0] : req.ip;
  }
}
