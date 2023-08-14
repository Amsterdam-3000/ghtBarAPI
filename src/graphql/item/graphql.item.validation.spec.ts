import * as request from 'supertest';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';

import { PrismaClientExtended } from '../../prisma/prisma';
import { GraphqlItemModule } from './graphql.item.module';

const fullItem = {
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
const uniqueItem = {
  name: 'item',
};
const validItem = {
  name: 'item',
  strength: 1,
};
const emptyItemName = {
  name: '',
  strength: 1,
};
const invalidItemStrength = {
  name: 'item',
  strength: 101,
};

const createItemQuery =
  'mutation Mutation($data: ItemCreateInput!)' +
  '{ createOneItem(data: $data) { id name } }';
const updateItemQuery =
  'mutation Mutation($data: ItemUpdateInput!, $where: ItemWhereUniqueInput!)' +
  '{ updateOneItem(data: $data, where: $where) { id name } }';
const upsertItemQuery =
  'mutation Mutation($where: ItemWhereUniqueInput!, $create: ItemCreateInput!, $update: ItemUpdateInput!)' +
  '{ upsertOneItem(where: $where, create: $create, update: $update) { id name } }';
const createManyItemQuery =
  'mutation Mutation($data: [ItemCreateManyInput!]!)' +
  '{ createManyItem(data: $data) { count } }';
const updateManyItemQuery =
  'mutation Mutation($data: ItemUpdateManyMutationInput!, $where: ItemWhereInput)' +
  '{ updateManyItem(data: $data, where: $where) { count } }';

const getItemQueryVars = (query: string, data: object, data2?: object) => {
  switch (query) {
    case createItemQuery:
      return { data: data };
    case updateItemQuery:
      return { where: uniqueItem, data: data };
    case upsertItemQuery:
      return { where: uniqueItem, create: data, update: data2 };
    case createManyItemQuery:
      return { data: [data] };
    case updateManyItemQuery:
      return { data: data, where: { name: { equals: 'item' } } };
  }
};

const expectValidationError = (res: request.Response) => {
  expect(res.body.errors).toBeArrayOfSize(1);
  expect(res.body.errors[0].message).toBe('Argument Validation Error');
};

describe('GraphqlItemValidation', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  const requestItemMutation = (query: string, data: object, data2?: object) => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: 'Mutation',
        query: query,
        variables: getItemQueryVars(query, data, data2),
      });
  };

  beforeAll(async () => {
    prisma = mockDeep<PrismaClientExtended>();
    prisma.item.create.mockResolvedValue(fullItem);
    prisma.item.update.mockResolvedValue(fullItem);
    prisma.item.upsert.mockResolvedValue(fullItem);
    prisma.item.createMany.mockResolvedValue({ count: 1 });
    prisma.item.updateMany.mockResolvedValue({ count: 1 });

    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: async () => ({
            validate: true,
            authChecker: () => true,
            context: () => ({ prisma: prisma }),
          }),
          imports: [GraphqlItemModule],
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should create item', () => {
    return requestItemMutation(createItemQuery, validItem).expect(
      '{"data":{"createOneItem":{"id":"1","name":"item"}}}\n',
    );
  });
  it('should throw error for creation empty item name', () => {
    return requestItemMutation(createItemQuery, emptyItemName).expect(
      expectValidationError,
    );
  });
  it('should throw error for creation invalid item strength', () => {
    return requestItemMutation(createItemQuery, invalidItemStrength).expect(
      expectValidationError,
    );
  });

  it('should update item', () => {
    return requestItemMutation(updateItemQuery, validItem).expect(
      '{"data":{"updateOneItem":{"id":"1","name":"item"}}}\n',
    );
  });
  it('should throw error for update empty item name', () => {
    return requestItemMutation(updateItemQuery, emptyItemName).expect(
      expectValidationError,
    );
  });
  it('should throw error for update invalid item strength', () => {
    return requestItemMutation(updateItemQuery, invalidItemStrength).expect(
      expectValidationError,
    );
  });

  it('should upsert item', () => {
    return requestItemMutation(upsertItemQuery, validItem, validItem).expect(
      '{"data":{"upsertOneItem":{"id":"1","name":"item"}}}\n',
    );
  });
  it('should throw error for upsert empty item name', () => {
    return requestItemMutation(
      upsertItemQuery,
      validItem,
      emptyItemName,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert invalid item strength', () => {
    return requestItemMutation(
      upsertItemQuery,
      invalidItemStrength,
      validItem,
    ).expect(expectValidationError);
  });

  it('should create many item', () => {
    return requestItemMutation(createManyItemQuery, validItem).expect(
      '{"data":{"createManyItem":{"count":1}}}\n',
    );
  });
  it('should throw error for creation many empty item name', () => {
    return requestItemMutation(createManyItemQuery, emptyItemName).expect(
      expectValidationError,
    );
  });
  it('should throw error for creation many invalid item strength', () => {
    return requestItemMutation(createManyItemQuery, invalidItemStrength).expect(
      expectValidationError,
    );
  });

  it('should update many item', () => {
    return requestItemMutation(updateManyItemQuery, validItem).expect(
      '{"data":{"updateManyItem":{"count":1}}}\n',
    );
  });
  it('should throw error for update many empty item name', () => {
    return requestItemMutation(updateManyItemQuery, emptyItemName).expect(
      expectValidationError,
    );
  });
  it('should throw error for update many invalid item strength', () => {
    return requestItemMutation(updateManyItemQuery, invalidItemStrength).expect(
      expectValidationError,
    );
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
