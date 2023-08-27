import { MiddlewareInterface, NextFn, ResolverData } from 'type-graphql';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLResolveInfoWithCacheControl } from '@apollo/cache-control-types';

import { IAppContext } from '../../app/app.model';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class GraphqlCacheMiddleware
  implements MiddlewareInterface<IAppContext>
{
  constructor(
    private logger: LoggerService,
    private config: ConfigService,
  ) {
    this.logger.setContext(GraphqlCacheMiddleware.name);
  }

  async use(data: ResolverData<IAppContext>, next: NextFn) {
    //TODO Remove this check and assign whole Class by UseMiddleware to Queries
    if (data.info.parentType.name !== 'Query') return next();
    const cacheMaxAge = this.config.get<number>('CACHE_MAX_AGE');

    this.logger
      .setReq(data.context.req)
      .log(
        `${LoggerService.gqlToStr(data)}: cacheMaxAge(${cacheMaxAge}s) is set`,
      );

    (data.info as GraphQLResolveInfoWithCacheControl).cacheControl.setCacheHint(
      { maxAge: cacheMaxAge },
    );
    return next();
  }
}
