import * as request from 'supertest';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';

import { PrismaClientExtended } from '../../prisma/prisma';
import { GraphqlItemModule } from '../item/graphql.item.module';
import { GraphqlCountryModule } from './graphql.country.module';

const item = {
  id: '1',
  countryId: '2',
  typeId: '3',
  userId: '4',
  name: 'item',
  strength: 1,
  image: { urlJpg: 'urlJpg' },
  createdAt: new Date(),
  updatedAt: new Date(),
};
const country = {
  id: '2',
  name: 'country',
};

const createItemQuery =
  'mutation Mutation($data: ItemCreateInput!)' +
  '{ createOneItem(data: $data) { id countryId } }';
const updateItemQuery =
  'mutation Mutation($data: ItemUpdateInput!, $where: ItemWhereUniqueInput!)' +
  '{ updateOneItem(data: $data, where: $where) { id countryId } }';
const upsertItemQuery =
  'mutation Mutation($where: ItemWhereUniqueInput!, $create: ItemCreateInput!, $update: ItemUpdateInput!)' +
  '{ upsertOneItem(where: $where, create: $create, update: $update) { id countryId } }';

const connectCountry = { connect: country };
const createCountry = { create: country };
const connectOrCreateCountry = {
  connectOrCreate: { where: country, create: country },
};
const deleteCountry = { delete: true };
const updateCountry = { update: { name: 'country' } };
const upsertCountry = { create: country, update: { name: 'country' } };

const getItemQueryCountryVars = (
  query: string,
  data: object,
  data2?: object,
) => {
  const itemData = { name: 'item', country: data };
  const itemData2 = { name: 'item', country: data2 };
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

describe('GraphqlCountryValidation', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  const requestItemMutation = (query: string, data: object, data2?: object) => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: 'Mutation',
        query: query,
        variables: getItemQueryCountryVars(query, data, data2),
      });
  };

  beforeAll(async () => {
    prisma = mockDeep<PrismaClientExtended>();
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
          imports: [GraphqlCountryModule, GraphqlItemModule],
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should create item with connection to country', () => {
    return requestItemMutation(createItemQuery, connectCountry).expect(
      '{"data":{"createOneItem":{"id":"1","countryId":"2"}}}\n',
    );
  });
  it('should throw error for creation item with country', () => {
    return requestItemMutation(createItemQuery, createCountry).expect(
      expectValidationError,
    );
  });
  it('should throw error for creation (connection) item with country', () => {
    return requestItemMutation(createItemQuery, connectOrCreateCountry).expect(
      expectValidationError,
    );
  });

  it('should update item with connection to country', () => {
    return requestItemMutation(updateItemQuery, connectCountry).expect(
      '{"data":{"updateOneItem":{"id":"1","countryId":"2"}}}\n',
    );
  });
  it('should throw error for update item with creation country', () => {
    return requestItemMutation(updateItemQuery, createCountry).expect(
      expectValidationError,
    );
  });
  it('should throw error for update item with creation (connection) country', () => {
    return requestItemMutation(updateItemQuery, connectOrCreateCountry).expect(
      expectValidationError,
    );
  });
  it('should throw error for update item with deletion country', () => {
    return requestItemMutation(updateItemQuery, deleteCountry).expect(
      expectValidationError,
    );
  });
  it('should throw error for update item with update country', () => {
    return requestItemMutation(updateItemQuery, updateCountry).expect(
      expectValidationError,
    );
  });
  it('should throw error for update item with upsert country', () => {
    return requestItemMutation(updateItemQuery, upsertCountry).expect(
      expectValidationError,
    );
  });

  it('should upsert item with connection to country', () => {
    return requestItemMutation(
      upsertItemQuery,
      connectCountry,
      connectCountry,
    ).expect('{"data":{"upsertOneItem":{"id":"1","countryId":"2"}}}\n');
  });
  it('should throw error for upsert item with create country', () => {
    return requestItemMutation(
      upsertItemQuery,
      createCountry,
      connectCountry,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with create (connection) country', () => {
    return requestItemMutation(
      upsertItemQuery,
      connectOrCreateCountry,
      connectCountry,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with update (create) country', () => {
    return requestItemMutation(
      upsertItemQuery,
      connectCountry,
      createCountry,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with update (create (connection)) country', () => {
    return requestItemMutation(
      upsertItemQuery,
      connectCountry,
      connectOrCreateCountry,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with update country', () => {
    return requestItemMutation(
      upsertItemQuery,
      connectCountry,
      updateCountry,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with update (delete) country', () => {
    return requestItemMutation(
      upsertItemQuery,
      connectCountry,
      deleteCountry,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with update (upsert) country', () => {
    return requestItemMutation(
      upsertItemQuery,
      connectCountry,
      upsertCountry,
    ).expect(expectValidationError);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
