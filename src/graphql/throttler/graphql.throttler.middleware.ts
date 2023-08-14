import { MiddlewareInterface, NextFn, ResolverData } from 'type-graphql';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

import { IAppContext } from '../../app/app.model';
import { ThrottlerGuard } from '../../throttler/throttler.guard';

@Injectable()
export class GraphqlThrottlerMiddleware
  implements MiddlewareInterface<IAppContext>
{
  constructor(
    private config: ConfigService,
    private throttlerGuard: ThrottlerGuard,
  ) {}

  async use(data: ResolverData<IAppContext>, next: NextFn) {
    //TODO Remove this check and assign whole Class by UseMiddleware to Resolvers
    if (data.info.fieldName !== 'createOneUser') return next();

    Throttle(
      this.config.get<number>('THROTTLER_SIGNUP_LIMIT'),
      this.config.get<number>('THROTTLER_SIGNUP_TTL'),
    )(this.use);
    await this.throttlerGuard.canActivate(
      new ExecutionContextHost(
        [data.context.req, data.context.req.res, next],
        GraphqlThrottlerMiddleware,
        this.use,
      ),
    );
    return next();
  }
}
