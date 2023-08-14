import { Module } from '@nestjs/common';

import { LoggerService } from '../../logger/logger.service';
import { GraphqlErrorFormatter } from './graphql.error.formatter';

@Module({
  imports: [],
  providers: [GraphqlErrorFormatter, LoggerService],
  exports: [GraphqlErrorFormatter],
})
export class GraphqlErrorModule {}
