import { Module } from '@nestjs/common';

import { LoggerService } from '../../logger/logger.service';
import { ThrottlerGuard } from '../../throttler/throttler.guard';
import { GraphqlThrottlerMiddleware } from './graphql.throttler.middleware';

@Module({
  providers: [ThrottlerGuard, GraphqlThrottlerMiddleware, LoggerService],
  exports: [ThrottlerGuard, GraphqlThrottlerMiddleware],
})
export class GraphqlThrottlerModule {}
