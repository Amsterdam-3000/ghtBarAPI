import { Module } from '@nestjs/common';

import { GraphqlErrorFormatter } from './graphql.error.formatter';

@Module({
  imports: [],
  providers: [GraphqlErrorFormatter],
  exports: [GraphqlErrorFormatter],
})
export class GraphqlErrorModule {}
