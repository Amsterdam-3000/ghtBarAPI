import * as request from 'supertest';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { Field, ObjectType, Query, Resolver } from 'type-graphql';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';

import { LoggerService } from '../../logger/logger.service';
import { LoggerModuleMock } from '../../logger/logger.mock';
import { GraphqlLimiterPlugin } from './graphql.limiter.plugin';

@ObjectType()
class TestType {
  @Field()
  test1: string;
  @Field()
  test2: string;
  @Field()
  test3: string;
  @Field()
  type?: TestType;
}

@Resolver(() => TestType)
export class TestResolver {
  @Query(() => TestType)
  query(): TestType {
    return {
      test1: 'test1',
      test2: 'test2',
      test3: 'test2',
      type: null,
    };
  }
}

describe('GraphqlLimiterPlugin', () => {
  let app: INestApplication;
  let logger: LoggerService;

  beforeAll(async () => {
    process.env.GRAPHQL_DEPTH_LIMIT = '1';
    process.env.GRAPHQL_COMPLEXITY_LIMIT = '3';

    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: (logger: LoggerService) => ({
            logger: logger,
            context: (data) => data,
          }),
          imports: [LoggerModuleMock],
          inject: [LoggerService],
        }),
        ConfigModule.forRoot({ ignoreEnvFile: true, isGlobal: true }),
      ],
      providers: [GraphqlLimiterPlugin, TestResolver],
    }).compile();

    logger = await module.resolve<LoggerService>(LoggerService);
    app = module.createNestApplication();
    await app.init();
  });

  it('should not throw error with right deep and complexity', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'query Test { query { test1 } }',
        operationName: 'Test',
      })
      .expect(200)
      .expect('{"data":{"query":{"test1":"test1"}}}\n');
  });

  it('should throw error with exceeded complexity', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'query Test { query { test1 test2 test3 } }',
        operationName: 'Test',
      })
      .expect(500)
      .expect((res) => {
        expect(res.body.errors).toBeArrayOfSize(1);
        expect(res.body.errors[0].message).toBe(
          'Query is too complex: 4. Maximum allowed complexity: 3',
        );
      });
  });

  it('should throw error with exceeded depth', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'query Test { query { type { test1 } } }',
        operationName: 'Test',
      })
      .expect(500)
      .expect((res) => {
        expect(res.body.errors).toBeArrayOfSize(1);
        expect(res.body.errors[0].message).toBe(
          "'Test' exceeds maximum operation depth of 1",
        );
      });
  });

  it('should be logged', () => {
    jest.clearAllMocks();
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ query { test1 } }' })
      .expect(200)
      .then(() => {
        expect(logger.info).toHaveBeenCalledTimes(1);
      });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
