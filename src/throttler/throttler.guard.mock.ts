import { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerException } from '@nestjs/throttler/dist/throttler.exception';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';

export class ThrottlerGuardMock implements Partial<ThrottlerGuard> {
  private ips = new Set();

  init() {
    this.ips.clear();
  }

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (this.ips.has(req.query.ip)) throw new ThrottlerException();
    this.ips.add(req.query.ip);
    return true;
  }
}
