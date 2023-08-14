import { Module } from '@nestjs/common';

import { LoggerService } from '../../logger/logger.service';
import { GraphqlCacheMiddleware } from './graphql.cache.middleware';

@Module({
  imports: [],
  providers: [GraphqlCacheMiddleware, LoggerService],
  exports: [GraphqlCacheMiddleware],
})
export class GraphqlCacheModule {}
