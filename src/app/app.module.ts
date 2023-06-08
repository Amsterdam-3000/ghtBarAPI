import { Module } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { TypeGraphQLModule } from 'typegraphql-nestjs';

import { authChecker } from '../auth/auth.checker';
import { IAppContext } from './app.model';
import { AuthModule } from '../auth/auth.module';
import { GraphqlModule } from '../graphql/graphql.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeGraphQLModule.forRootAsync({
      driver: ApolloDriver,
      useFactory: async () => ({
        emitSchemaFile: true,
        validate: true,
        playground: false,
        authChecker: authChecker,
        context: ({ req }): IAppContext => ({
          prisma: req.prisma,
          user: req.user,
        }),
        plugins: [
          //TODO Convert project to ES modules (Nest doesn't support ES modules yet)
          (
            await import('@apollo/server/plugin/landingPage/default')
          ).ApolloServerPluginLandingPageLocalDefault(),
        ],
      }),
      imports: [GraphqlModule],
    }),
    AuthModule,
  ],
})
export class AppModule {}
