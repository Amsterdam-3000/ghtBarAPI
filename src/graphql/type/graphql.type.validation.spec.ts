import * as request from 'supertest';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';

import { PrismaClientExtended } from '../../prisma/prisma';
import { GraphqlItemModule } from '../item/graphql.item.module';
import { GraphqlTypeModule } from './graphql.type.module';

const item = {
  id: '1',
  typeId: '2',
  countryId: '3',
  userId: '4',
  name: 'item',
  strength: 1,
  image: { urlJpg: 'urlJpg' },
  createdAt: new Date(),
  updatedAt: new Date(),
};
const fullType = {
  id: '2',
  name: 'type',
};
const validType = {
  name: 'type',
};
const emptyType = {
  name: '',
};

const createTypeQuery =
  'mutation Mutation($data: TypeCreateInput!)' +
  '{ createOneType(data: $data) { id name } }';
const updateTypeQuery =
  'mutation Mutation($data: TypeUpdateInput!, $where: TypeWhereUniqueInput!)' +
  '{ updateOneType(data: $data, where: $where) { id name } }';
const upsertTypeQuery =
  'mutation Mutation($where: TypeWhereUniqueInput!, $create: TypeCreateInput!, $update: TypeUpdateInput!)' +
  '{ upsertOneType(where: $where, create: $create, update: $update) { id name } }';
const createManyTypeQuery =
  'mutation Mutation($data: [TypeCreateManyInput!]!)' +
  '{ createManyType(data: $data) { count } }';
const updateManyTypeQuery =
  'mutation Mutation($data: TypeUpdateManyMutationInput!, $where: TypeWhereInput)' +
  '{ updateManyType(data: $data, where: $where) { count } }';

const getTypeQueryVars = (query: string, data: object, data2?: object) => {
  switch (query) {
    case createTypeQuery:
      return { data: data };
    case updateTypeQuery:
      return { where: validType, data: data };
    case upsertTypeQuery:
      return { where: validType, create: data, update: data2 };
    case createManyTypeQuery:
      return { data: [data] };
    case updateManyTypeQuery:
      return { data: data, where: { name: { equals: 'type' } } };
  }
};

const createItemQuery =
  'mutation Mutation($data: ItemCreateInput!)' +
  '{ createOneItem(data: $data) { id typeId } }';
const updateItemQuery =
  'mutation Mutation($data: ItemUpdateInput!, $where: ItemWhereUniqueInput!)' +
  '{ updateOneItem(data: $data, where: $where) { id typeId } }';
const upsertItemQuery =
  'mutation Mutation($where: ItemWhereUniqueInput!, $create: ItemCreateInput!, $update: ItemUpdateInput!)' +
  '{ upsertOneItem(where: $where, create: $create, update: $update) { id typeId } }';

const connectType = { connect: validType };
const createType = { create: validType };
const createEmptyType = { create: emptyType };
const connectOrCreateEmptyType = {
  connectOrCreate: { where: validType, create: emptyType },
};
const deleteType = { delete: { name: { equals: 'type' } } };
const updateType = { update: { data: validType } };
const updateEmptyType = { update: { data: emptyType } };
const upsertType = { create: validType, update: { data: validType } };
const upsertEmptyType = { create: emptyType, update: { data: emptyType } };

const getItemQueryTypeVars = (query: string, data: object, data2?: object) => {
  const itemData = { name: 'item', type: data };
  const itemData2 = { name: 'item', type: data2 };
  switch (query) {
    case createItemQuery:
      return { data: itemData };
    case updateItemQuery:
      return { where: { id: '1' }, data: itemData };
    case upsertItemQuery:
      return { where: { id: '1' }, create: itemData, update: itemData2 };
  }
};

const expectValidationError = (res: request.Response) => {
  expect(res.body.errors).toBeArrayOfSize(1);
  expect(res.body.errors[0].message).toBe('Argument Validation Error');
};

describe('GraphqlTypeValidation', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  const requestMutation = (query: string, data: object, data2?: object) => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: 'Mutation',
        query: query,
        variables: query.includes('Type')
          ? getTypeQueryVars(query, data, data2)
          : getItemQueryTypeVars(query, data, data2),
      });
  };

  beforeAll(async () => {
    prisma = mockDeep<PrismaClientExtended>();
    prisma.type.create.mockResolvedValue(fullType);
    prisma.type.update.mockResolvedValue(fullType);
    prisma.type.upsert.mockResolvedValue(fullType);
    prisma.type.createMany.mockResolvedValue({ count: 1 });
    prisma.type.updateMany.mockResolvedValue({ count: 1 });
    prisma.item.create.mockResolvedValue(item);
    prisma.item.update.mockResolvedValue(item);
    prisma.item.upsert.mockResolvedValue(item);

    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: async () => ({
            validate: true,
            authChecker: () => true,
            context: () => ({ prisma: prisma }),
          }),
          imports: [GraphqlTypeModule, GraphqlItemModule],
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should create type', () => {
    return requestMutation(createTypeQuery, validType).expect(
      '{"data":{"createOneType":{"id":"2","name":"type"}}}\n',
    );
  });
  it('should throw error for creation empty type', () => {
    return requestMutation(createTypeQuery, emptyType).expect(
      expectValidationError,
    );
  });

  it('should update type', () => {
    return requestMutation(updateTypeQuery, validType).expect(
      '{"data":{"updateOneType":{"id":"2","name":"type"}}}\n',
    );
  });
  it('should throw error for update empty type', () => {
    return requestMutation(updateTypeQuery, emptyType).expect(
      expectValidationError,
    );
  });

  it('should upsert type', () => {
    return requestMutation(upsertTypeQuery, validType, validType).expect(
      '{"data":{"upsertOneType":{"id":"2","name":"type"}}}\n',
    );
  });
  it('should throw error for update (create) empty type', () => {
    return requestMutation(upsertTypeQuery, emptyType, validType).expect(
      expectValidationError,
    );
  });
  it('should throw error for update (update) empty type', () => {
    return requestMutation(upsertTypeQuery, validType, emptyType).expect(
      expectValidationError,
    );
  });

  it('should create many type', () => {
    return requestMutation(createManyTypeQuery, validType).expect(
      '{"data":{"createManyType":{"count":1}}}\n',
    );
  });
  it('should throw error for creation many empty type', () => {
    return requestMutation(createManyTypeQuery, emptyType).expect(
      expectValidationError,
    );
  });

  it('should update many type', () => {
    return requestMutation(updateManyTypeQuery, validType).expect(
      '{"data":{"updateManyType":{"count":1}}}\n',
    );
  });
  it('should throw error for update many empty type', () => {
    return requestMutation(updateManyTypeQuery, emptyType).expect(
      expectValidationError,
    );
  });

  it('should create item with creation type', () => {
    return requestMutation(createItemQuery, createType).expect(
      '{"data":{"createOneItem":{"id":"1","typeId":"2"}}}\n',
    );
  });
  it('should throw error for creation item with empty type', () => {
    return requestMutation(createItemQuery, createEmptyType).expect(
      expectValidationError,
    );
  });
  it('should throw error for creation (connection) item with empty type', () => {
    return requestMutation(createItemQuery, connectOrCreateEmptyType).expect(
      expectValidationError,
    );
  });

  it('should update item with update type', () => {
    return requestMutation(updateItemQuery, updateType).expect(
      '{"data":{"updateOneItem":{"id":"1","typeId":"2"}}}\n',
    );
  });
  it('should throw error for update item with creation empty type', () => {
    return requestMutation(updateItemQuery, createEmptyType).expect(
      expectValidationError,
    );
  });
  it('should throw error for update item with creation (connection) empty type', () => {
    return requestMutation(updateItemQuery, connectOrCreateEmptyType).expect(
      expectValidationError,
    );
  });
  it('should update item with deletion type', () => {
    return requestMutation(updateItemQuery, deleteType).expect(
      '{"data":{"updateOneItem":{"id":"1","typeId":"2"}}}\n',
    );
  });
  it('should throw error for update item with update empty type', () => {
    return requestMutation(updateItemQuery, updateEmptyType).expect(
      expectValidationError,
    );
  });
  it('should throw error for update item with upsert empty type', () => {
    return requestMutation(updateItemQuery, upsertEmptyType).expect(
      expectValidationError,
    );
  });

  it('should upsert item with upsert type', () => {
    return requestMutation(upsertItemQuery, connectType, upsertType).expect(
      '{"data":{"upsertOneItem":{"id":"1","typeId":"2"}}}\n',
    );
  });
  it('should throw error for upsert item with create empty type', () => {
    return requestMutation(
      upsertItemQuery,
      createEmptyType,
      connectType,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with create (connection) empty type', () => {
    return requestMutation(
      upsertItemQuery,
      connectOrCreateEmptyType,
      connectType,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with update (create) empty type', () => {
    return requestMutation(
      upsertItemQuery,
      connectType,
      createEmptyType,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with update (create (connection)) empty type', () => {
    return requestMutation(
      upsertItemQuery,
      connectType,
      connectOrCreateEmptyType,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with update empty type', () => {
    return requestMutation(
      upsertItemQuery,
      connectType,
      updateEmptyType,
    ).expect(expectValidationError);
  });
  it('should upsert item with update (delete) type', () => {
    return requestMutation(upsertItemQuery, connectType, deleteType).expect(
      '{"data":{"upsertOneItem":{"id":"1","typeId":"2"}}}\n',
    );
  });
  it('should throw error for upsert item with update (upsert) empty type', () => {
    return requestMutation(
      upsertItemQuery,
      connectType,
      upsertEmptyType,
    ).expect(expectValidationError);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
