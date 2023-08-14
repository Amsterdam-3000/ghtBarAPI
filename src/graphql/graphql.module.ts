import { Request } from 'express';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { Module } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';

import { IAppContext } from '../app/app.model';
import { LoggerModule } from '../logger/logger.module';
import { LoggerService } from '../logger/logger.service';
import { GraphqlAuthModule } from './auth/graphql.auth.module';
import { GraphqlAuthChecker } from './auth/graphql.auth.checker';
import { GraphqlThrottlerModule } from './throttler/graphql.throttler.module';
import { GraphqlThrottlerMiddleware } from './throttler/graphql.throttler.middleware';
import { GraphqlCacheModule } from './cache/graphql.cache.module';
import { GraphqlCacheMiddleware } from './cache/graphql.cache.middleware';
import { GraphqlErrorModule } from './error/graphql.error.module';
import { GraphqlErrorFormatter } from './error/graphql.error.formatter';
import { GraphqlLimiterPlugin } from './limiter/graphql.limiter.plugin';
import { GraphqlUserModule } from './user/graphql.user.module';
import { GraphqlItemModule } from './item/graphql.item.module';
import { GraphqlTypeModule } from './type/graphql.type.module';
import { GraphqlCountryModule } from './country/graphql.country.module';

@Module({
  imports: [
    TypeGraphQLModule.forRootAsync({
      driver: ApolloDriver,
      useFactory: async (
        logger: LoggerService,
        config: ConfigService,
        authChecker: GraphqlAuthChecker,
        errorFormatter: GraphqlErrorFormatter,
        cacheMiddleware: GraphqlCacheMiddleware,
        throttlerMiddleware: GraphqlThrottlerMiddleware,
      ) => {
        logger.setContext(TypeGraphQLModule.name);

        return {
          emitSchemaFile: true,
          validate: true,
          playground: false,
          autoTransformHttpErrors: true,
          introspection: config.get<boolean>('APOLLO_SERVER_INTROSPECTION'),
          includeStacktraceInErrorResponses: config.get<boolean>(
            'APOLLO_SERVER_ERROR_STACKTRACE',
          ),
          logger: logger,
          //TODO Change to Nest Auth Guard (TypeGraphQL doesn't support Guards yet)
          authChecker: authChecker.check.bind(authChecker),
          globalMiddlewares: [
            throttlerMiddleware.use.bind(throttlerMiddleware),
            cacheMiddleware.use.bind(cacheMiddleware),
          ],
          context: (data: { req: Request }): IAppContext => {
            logger.setReq(data.req);
            return {
              prisma: data.req.prisma,
              user: data.req.user,
              req: data.req,
            };
          },
          formatError: await errorFormatter.getFormatter(logger),
          plugins: [
            //TODO Convert project to ES modules (Nest doesn't support ES modules yet)
            (
              await import('@apollo/server/plugin/landingPage/default')
            ).ApolloServerPluginLandingPageLocalDefault(),
            //TODO Serverside cache?
            // (await import('@apollo/server-plugin-response-cache')).default(),
          ],
        };
      },
      imports: [
        LoggerModule,
        GraphqlAuthModule,
        GraphqlThrottlerModule,
        GraphqlCacheModule,
        GraphqlErrorModule,
        GraphqlUserModule,
        GraphqlCountryModule,
        GraphqlTypeModule,
        GraphqlItemModule,
      ],
      inject: [
        LoggerService,
        ConfigService,
        GraphqlAuthChecker,
        GraphqlErrorFormatter,
        GraphqlCacheMiddleware,
        GraphqlThrottlerMiddleware,
      ],
    }),
  ],
  providers: [GraphqlLimiterPlugin],
})
export class GraphqlModule {}
