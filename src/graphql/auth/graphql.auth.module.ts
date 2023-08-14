import { Module } from '@nestjs/common';

import { LoggerService } from '../../logger/logger.service';
import { GraphqlAuthChecker } from './graphql.auth.checker';

@Module({
  providers: [LoggerService, GraphqlAuthChecker],
  exports: [GraphqlAuthChecker],
})
export class GraphqlAuthModule {}
