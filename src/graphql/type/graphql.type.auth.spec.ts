import * as request from 'supertest';
import { ResolverData } from 'type-graphql';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';

import { PrismaClientExtended } from '../../prisma/prisma';
import { IAppContext } from '../../app/app.model';
import { GraphqlTypeModule } from './graphql.type.module';

const type = {
  id: '1',
  name: 'type',
};

const createTypeQuery =
  'mutation Mutation($data: TypeCreateInput!)' +
  '{ createOneType(data: $data) { id name } }';
const updateTypeQuery =
  'mutation Mutation($data: TypeUpdateInput!, $where: TypeWhereUniqueInput!)' +
  '{ updateOneType(data: $data, where: $where) { id name } }';
const deleteTypeQuery =
  'mutation Mutation($where: TypeWhereUniqueInput!)' +
  '{ deleteOneType(where: $where) { id name } }';
const upsertTypeQuery =
  'mutation Mutation($where: TypeWhereUniqueInput!, $create: TypeCreateInput!, $update: TypeUpdateInput!)' +
  '{ upsertOneType(where: $where, create: $create, update: $update) { id name } }';
const createManyTypeQuery =
  'mutation Mutation($data: [TypeCreateManyInput!]!)' +
  '{ createManyType(data: $data) { count } }';
const updateManyTypeQuery =
  'mutation Mutation($data: TypeUpdateManyMutationInput!, $where: TypeWhereInput)' +
  '{ updateManyType(data: $data, where: $where) { count } }';
const deleteManyTypeQuery =
  'mutation Mutation($where: TypeWhereInput)' +
  '{ deleteManyType(where: $where) { count } }';

const getTypeQueryVars = (query: string) => {
  const typeData = { name: 'type' };
  const typeFilter = { name: { equals: 'type' } };
  switch (query) {
    case createTypeQuery:
      return { data: typeData };
    case updateTypeQuery:
      return { where: typeData, data: typeData };
    case deleteTypeQuery:
      return { where: typeData };
    case upsertTypeQuery:
      return { where: typeData, create: typeData, update: typeData };
    case createManyTypeQuery:
      return { data: [typeData] };
    case updateManyTypeQuery:
      return { data: typeData, where: typeFilter };
    case deleteManyTypeQuery:
      return { where: typeFilter };
  }
};

const expectAccessDenied = (res: request.Response) => {
  expect(res.body.errors).toBeArrayOfSize(1);
  expect(res.body.errors[0].message).toBe(
    "Access denied! You don't have permission for this action!",
  );
};

describe('GraphqlTypeAuth', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  const requestTypeMutation = (role: string, query: string) => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: role })
      .send({
        operationName: 'Mutation',
        query: query,
        variables: getTypeQueryVars(query),
      });
  };

  beforeAll(async () => {
    prisma = mockDeep<PrismaClientExtended>();
    prisma.type.create.mockResolvedValue(type);
    prisma.type.update.mockResolvedValue(type);
    prisma.type.delete.mockResolvedValue(type);
    prisma.type.upsert.mockResolvedValue(type);
    prisma.type.createMany.mockResolvedValue({ count: 1 });
    prisma.type.updateMany.mockResolvedValue({ count: 1 });
    prisma.type.deleteMany.mockResolvedValue({ count: 1 });

    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: async () => ({
            authChecker: (data: ResolverData<IAppContext>, roles: string[]) =>
              roles.includes(data.context.req.query.role as string),
            context: () => ({ prisma: prisma }),
          }),
          imports: [GraphqlTypeModule],
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should create type by admin', () => {
    return requestTypeMutation('ADMIN', createTypeQuery).expect(
      '{"data":{"createOneType":{"id":"1","name":"type"}}}\n',
    );
  });
  it('should throw error for create type by user', () => {
    return requestTypeMutation('USER', createTypeQuery).expect(
      expectAccessDenied,
    );
  });

  it('should update type by admin', () => {
    return requestTypeMutation('ADMIN', updateTypeQuery).expect(
      '{"data":{"updateOneType":{"id":"1","name":"type"}}}\n',
    );
  });
  it('should throw error for update type by user', () => {
    return requestTypeMutation('USER', updateTypeQuery).expect(
      expectAccessDenied,
    );
  });

  it('should delete type by admin', () => {
    return requestTypeMutation('ADMIN', deleteTypeQuery).expect(
      '{"data":{"deleteOneType":{"id":"1","name":"type"}}}\n',
    );
  });
  it('should throw error for delete type by user', () => {
    return requestTypeMutation('USER', deleteTypeQuery).expect(
      expectAccessDenied,
    );
  });

  it('should upsert type by admin', () => {
    return requestTypeMutation('ADMIN', upsertTypeQuery).expect(
      '{"data":{"upsertOneType":{"id":"1","name":"type"}}}\n',
    );
  });
  it('should throw error for upsert type by user', () => {
    return requestTypeMutation('USER', upsertTypeQuery).expect(
      expectAccessDenied,
    );
  });

  it('should create many type by admin', () => {
    return requestTypeMutation('ADMIN', createManyTypeQuery).expect(
      '{"data":{"createManyType":{"count":1}}}\n',
    );
  });
  it('should throw error for create many type by user', () => {
    return requestTypeMutation('USER', createManyTypeQuery).expect(
      expectAccessDenied,
    );
  });

  it('should update many type by admin', () => {
    return requestTypeMutation('ADMIN', updateManyTypeQuery).expect(
      '{"data":{"updateManyType":{"count":1}}}\n',
    );
  });
  it('should throw error for update many type by user', () => {
    return requestTypeMutation('USER', updateManyTypeQuery).expect(
      expectAccessDenied,
    );
  });

  it('should delete many type by admin', () => {
    return requestTypeMutation('ADMIN', deleteManyTypeQuery).expect(
      '{"data":{"deleteManyType":{"count":1}}}\n',
    );
  });
  it('should throw error for delete many type by user', () => {
    return requestTypeMutation('USER', deleteManyTypeQuery).expect(
      expectAccessDenied,
    );
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
