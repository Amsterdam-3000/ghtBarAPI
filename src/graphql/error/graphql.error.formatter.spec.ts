import * as request from 'supertest';
import { IsNotEmpty } from 'class-validator';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { Arg, Field, InputType, Mutation, Query, Resolver } from 'type-graphql';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';

import { LoggerService } from '../../logger/logger.service';
import { LoggerModuleMock } from '../../logger/logger.mock';
import { GraphqlErrorFormatter } from './graphql.error.formatter';
import { GraphqlErrorModule } from './graphql.error.module';

@InputType()
export class TestInput {
  @Field()
  @IsNotEmpty()
  test: string;
}

@Resolver(() => String)
export class TestResolver {
  @Mutation(() => String)
  input(@Arg('data') data: TestInput) {
    return data.test;
  }

  @Query(() => String)
  error() {
    throw new Error('Error');
  }
}

describe('GraphqlErrorFormatter', () => {
  let app: INestApplication;
  let logger: LoggerService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: async (
            logger: LoggerService,
            errorFormatter: GraphqlErrorFormatter,
          ) => ({
            formatError: await errorFormatter.getFormatter(logger),
            context: (data) => data,
          }),
          imports: [LoggerModuleMock, GraphqlErrorModule],
          inject: [LoggerService, GraphqlErrorFormatter],
        }),
      ],
      providers: [TestResolver],
    }).compile();

    logger = await module.resolve<LoggerService>(LoggerService);
    app = module.createNestApplication();
    await app.init();
  });

  it('should not format error with non-validation error', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ error }' })
      .expect(200)
      .expect((res) => {
        expect(res.body.errors).toBeArrayOfSize(1);
        expect(res.body.errors[0].extensions?.code).toBe(
          'INTERNAL_SERVER_ERROR',
        );
      });
  });

  it('should format error with validation error', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { input }' })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeArrayOfSize(1);
        expect(res.body.errors[0].extensions?.code).toBe(
          'INTERNAL_SERVER_ERROR',
        );
      });
  });

  it('should not call formatter without errors', () => {
    jest.clearAllMocks();
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation Mutation($data: TestInput!) { input(data: $data) }',
        operationName: 'Mutation',
        variables: { data: { test: 'test' } },
      })
      .expect(200)
      .expect('{"data":{"input":"test"}}\n')
      .then(() => {
        expect(logger.log).not.toHaveBeenCalled();
      });
  });

  it('should be logged with non-validation error', () => {
    jest.clearAllMocks();
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ error }' })
      .then(() => {
        expect(logger.log).toHaveBeenCalledTimes(1);
      });
  });

  it('should be logged with validation error', () => {
    jest.clearAllMocks();
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'mutation { input }' })
      .then(() => {
        expect(logger.log).toHaveBeenCalledTimes(1);
      });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
