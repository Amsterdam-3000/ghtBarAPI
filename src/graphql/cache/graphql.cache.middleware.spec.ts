import * as request from 'supertest';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { Mutation, Query, Resolver } from 'type-graphql';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';

import { LoggerService } from '../../logger/logger.service';
import { LoggerServiceMock } from '../../logger/logger.mock';
import { GraphqlCacheMiddleware } from './graphql.cache.middleware';
import { GraphqlCacheModule } from './graphql.cache.module';

@Resolver(() => String)
export class TestResolver {
  @Query(() => String)
  query() {
    return 'query';
  }

  @Mutation(() => String)
  mutation() {
    return 'mutation';
  }
}

describe('GraphqlCacheMiddleware', () => {
  let app: INestApplication;
  let middleware: GraphqlCacheMiddleware;

  beforeAll(async () => {
    process.env.CACHE_MAX_AGE = '1';
    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: (middleware: GraphqlCacheMiddleware) => ({
            globalMiddlewares: [middleware.use.bind(middleware)],
          }),
          imports: [GraphqlCacheModule],
          inject: [GraphqlCacheMiddleware],
        }),
        ConfigModule.forRoot({ ignoreEnvFile: true, isGlobal: true }),
      ],
      providers: [TestResolver],
    })
      .overrideProvider(LoggerService)
      .useClass(LoggerServiceMock)
      .compile();
    middleware = module.get<GraphqlCacheMiddleware>(GraphqlCacheMiddleware);
    app = module.createNestApplication();
    await app.init();
  });

  it('should set logging context', async () => {
    expect(middleware['logger'].setContext).toBeCalledWith(
      GraphqlCacheMiddleware.name,
    );
  });

  it('should not set cache max age', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { mutation }' })
      .expect(200)
      .expect('{"data":{"mutation":"mutation"}}\n')
      .then((res) => {
        expect(res.headers['cache-control']).toBe('no-store');
      });
  });

  it('should set cache max age', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ query }' })
      .expect(200)
      .expect('{"data":{"query":"query"}}\n')
      .then((res) => {
        expect(res.headers['cache-control']).toBe('max-age=1, public');
      });
  });

  it('should not be logged', () => {
    jest.clearAllMocks();
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { mutation }' })
      .then(() => {
        expect(middleware['logger'].log).not.toHaveBeenCalled();
      });
  });

  it('should be logged', () => {
    jest.clearAllMocks();
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ query }' })
      .then(() => {
        expect(middleware['logger'].log).toHaveBeenCalled();
      });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
