import * as request from 'supertest';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { Mutation, Query, Resolver } from 'type-graphql';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';

import { ThrottlerGuard } from '../../throttler/throttler.guard';
import { ThrottlerGuardMock } from '../../throttler/throttler.guard.mock';
import { GraphqlThrottlerMiddleware } from './graphql.throttler.middleware';
import { GraphqlThrottlerModule } from './graphql.throttler.module';

@Resolver(() => String)
export class TestResolver {
  @Query(() => String)
  test() {
    return 'test';
  }

  @Mutation(() => String)
  createOneUser() {
    return 'user';
  }
}

describe('GraphqlThrottlerMiddleware', () => {
  let app: INestApplication;
  let guard: ThrottlerGuardMock;

  beforeAll(async () => {
    process.env.THROTTLER_SIGNUP_LIMIT = '1';
    process.env.THROTTLER_SIGNUP_TTL = '2';
    jest.spyOn(ThrottlerGuardMock.prototype, 'canActivate');

    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: (middleware: GraphqlThrottlerMiddleware) => ({
            globalMiddlewares: [middleware.use.bind(middleware)],
          }),
          imports: [GraphqlThrottlerModule],
          inject: [GraphqlThrottlerMiddleware],
        }),
        ConfigModule.forRoot({ ignoreEnvFile: true, isGlobal: true }),
      ],
      providers: [TestResolver],
    })
      .overrideProvider(ThrottlerGuard)
      .useClass(ThrottlerGuardMock)
      .compile();
    guard = module.get<ThrottlerGuardMock>(ThrottlerGuard);
    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    guard.init();
  });

  it('should not call throttler guard', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ test }' })
      .expect(200)
      .expect('{"data":{"test":"test"}}\n')
      .then(() => {
        expect(ThrottlerGuardMock.prototype.canActivate).not.toHaveBeenCalled();
      });
  });

  it('should not throw error for one request from one ip', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ ip: '1' })
      .send({ query: 'mutation { createOneUser }' })
      .expect(200)
      .expect('{"data":{"createOneUser":"user"}}\n')
      .then(() => {
        expect(ThrottlerGuardMock.prototype.canActivate).toHaveBeenCalled();
      });
  });

  it('should throw error for two requests from the same ip', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ ip: '1' })
      .send({ query: 'mutation { createOneUser }' })
      .expect(200)
      .expect('{"data":{"createOneUser":"user"}}\n')
      .then(() => {
        return request(app.getHttpServer())
          .post('/graphql')
          .query({ ip: '1' })
          .send({ query: 'mutation { createOneUser }' })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeArrayOfSize(1);
            expect(res.body.errors[0].message).toBe(
              'ThrottlerException: Too Many Requests',
            );
          })
          .then(() => {
            expect(
              ThrottlerGuardMock.prototype.canActivate,
            ).toHaveBeenCalledTimes(2);
          });
      });
  });

  it('should not throw error for two requests from different ips', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ ip: '1' })
      .send({ query: 'mutation { createOneUser }' })
      .expect(200)
      .expect('{"data":{"createOneUser":"user"}}\n')
      .then(() => {
        return request(app.getHttpServer())
          .post('/graphql')
          .query({ ip: '2' })
          .send({ query: 'mutation { createOneUser }' })
          .expect(200)
          .expect('{"data":{"createOneUser":"user"}}\n')
          .then(() => {
            expect(
              ThrottlerGuardMock.prototype.canActivate,
            ).toHaveBeenCalledTimes(2);
          });
      });
  });

  it('should set throttler parameters', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { createOneUser }' })
      .expect(200)
      .expect('{"data":{"createOneUser":"user"}}\n')
      .then(() => {
        const limit = Reflect.getMetadata(
          'THROTTLER:LIMIT',
          GraphqlThrottlerMiddleware.prototype.use,
        );
        expect(limit).toBe('1');
        const ttl = Reflect.getMetadata(
          'THROTTLER:TTL',
          GraphqlThrottlerMiddleware.prototype.use,
        );
        expect(ttl).toBe('2');
      });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
