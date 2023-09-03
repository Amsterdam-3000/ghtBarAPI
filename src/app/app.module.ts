import { APP_GUARD } from '@nestjs/core';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ThrottlerModule } from '../throttler/throttler.module';
import { ThrottlerGuard } from '../throttler/throttler.guard';
import { ThrottlerMiddleware } from '../throttler/throttler.middleware';
import { AuthModule } from '../auth/auth.module';
import { AuthMiddleware } from '../auth/auth.middleware';
import { GraphqlModule } from '../graphql/graphql.module';
import { LoggerModule } from '../logger/logger.module';
import { LoggerMiddleware } from '../logger/logger.middleware';
import { configSchema } from '../config/config.schema';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configSchema,
    }),
    ThrottlerModule,
    AuthModule,
    GraphqlModule,
  ],
  providers: [{ provide: APP_GUARD, useExisting: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('/*');
    //TODO Change to Nest Auth Guard (TypeGraphQL doesn't support Guards yet)
    consumer.apply(ThrottlerMiddleware, AuthMiddleware).forRoutes('graphql');
  }
}
