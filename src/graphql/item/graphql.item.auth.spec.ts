import * as request from 'supertest';
import { ResolverData } from 'type-graphql';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';

import { PrismaClientExtended } from '../../prisma/prisma';
import { IAppContext } from '../../app/app.model';
import { GraphqlItemModule } from './graphql.item.module';

const item = {
  id: '1',
  countryId: '2',
  typeId: '3',
  userId: '4',
  name: 'item',
  strength: 1,
  image: { urlJpg: 'urlJpg' },
  createdAt: new Date('2000-01-01T00:00:00.000Z'),
  updatedAt: new Date('2000-01-01T00:00:00.000Z'),
};

const createItemQuery =
  'mutation Mutation($data: ItemCreateInput!)' +
  '{ createOneItem(data: $data) { id name } }';
const updateItemQuery =
  'mutation Mutation($data: ItemUpdateInput!, $where: ItemWhereUniqueInput!)' +
  '{ updateOneItem(data: $data, where: $where) { id name } }';
const deleteItemQuery =
  'mutation Mutation($where: ItemWhereUniqueInput!)' +
  '{ deleteOneItem(where: $where) { id name } }';
const upsertItemQuery =
  'mutation Mutation($where: ItemWhereUniqueInput!, $create: ItemCreateInput!, $update: ItemUpdateInput!)' +
  '{ upsertOneItem(where: $where, create: $create, update: $update) { id name } }';
const createManyItemQuery =
  'mutation Mutation($data: [ItemCreateManyInput!]!)' +
  '{ createManyItem(data: $data) { count } }';
const updateManyItemQuery =
  'mutation Mutation($data: ItemUpdateManyMutationInput!, $where: ItemWhereInput)' +
  '{ updateManyItem(data: $data, where: $where) { count } }';
const deleteManyItemQuery =
  'mutation Mutation($where: ItemWhereInput)' +
  '{ deleteManyItem(where: $where) { count } }';

const getItemQueryVars = (query: string) => {
  const itemData = { name: 'type' };
  const itemFilter = { name: { equals: 'type' } };
  switch (query) {
    case createItemQuery:
      return { data: itemData };
    case updateItemQuery:
      return { where: itemData, data: itemData };
    case deleteItemQuery:
      return { where: itemData };
    case upsertItemQuery:
      return { where: itemData, create: itemData, update: itemData };
    case createManyItemQuery:
      return { data: [itemData] };
    case updateManyItemQuery:
      return { data: itemData, where: itemFilter };
    case deleteManyItemQuery:
      return { where: itemFilter };
  }
};

const expectAccessDenied = (res: request.Response) => {
  expect(res.body.errors).toBeArrayOfSize(1);
  expect(res.body.errors[0].message).toBe(
    "Access denied! You don't have permission for this action!",
  );
};

describe('GraphqlItemAuth', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  const requestItemMutation = (role: string, query: string) => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: role })
      .send({
        operationName: 'Mutation',
        query: query,
        variables: getItemQueryVars(query),
      });
  };

  beforeAll(async () => {
    prisma = mockDeep<PrismaClientExtended>();
    prisma.item.create.mockResolvedValue(item);
    prisma.item.update.mockResolvedValue(item);
    prisma.item.delete.mockResolvedValue(item);
    prisma.item.upsert.mockResolvedValue(item);
    prisma.item.createMany.mockResolvedValue({ count: 1 });
    prisma.item.updateMany.mockResolvedValue({ count: 1 });
    prisma.item.deleteMany.mockResolvedValue({ count: 1 });
    prisma.item.findMany.mockResolvedValue([item]);

    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: async () => ({
            authChecker: (data: ResolverData<IAppContext>, roles: string[]) =>
              roles.includes(data.context.req.query.role as string),
            context: () => ({ prisma: prisma }),
          }),
          imports: [GraphqlItemModule],
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should create item by admin', () => {
    return requestItemMutation('ADMIN', createItemQuery).expect(
      '{"data":{"createOneItem":{"id":"1","name":"item"}}}\n',
    );
  });
  it('should throw error for create item by user', () => {
    return requestItemMutation('USER', createItemQuery).expect(
      expectAccessDenied,
    );
  });

  it('should update item by admin', () => {
    return requestItemMutation('ADMIN', updateItemQuery).expect(
      '{"data":{"updateOneItem":{"id":"1","name":"item"}}}\n',
    );
  });
  it('should throw error for update item by user', () => {
    return requestItemMutation('USER', updateItemQuery).expect(
      expectAccessDenied,
    );
  });

  it('should delete item by admin', () => {
    return requestItemMutation('ADMIN', deleteItemQuery).expect(
      '{"data":{"deleteOneItem":{"id":"1","name":"item"}}}\n',
    );
  });
  it('should throw error for delete item by user', () => {
    return requestItemMutation('USER', deleteItemQuery).expect(
      expectAccessDenied,
    );
  });

  it('should upsert item by admin', () => {
    return requestItemMutation('ADMIN', upsertItemQuery).expect(
      '{"data":{"upsertOneItem":{"id":"1","name":"item"}}}\n',
    );
  });
  it('should throw error for upsert item by user', () => {
    return requestItemMutation('USER', upsertItemQuery).expect(
      expectAccessDenied,
    );
  });

  it('should create many item by admin', () => {
    return requestItemMutation('ADMIN', createManyItemQuery).expect(
      '{"data":{"createManyItem":{"count":1}}}\n',
    );
  });
  it('should throw error for create many item by user', () => {
    return requestItemMutation('USER', createManyItemQuery).expect(
      expectAccessDenied,
    );
  });

  it('should update many item by admin', () => {
    return requestItemMutation('ADMIN', updateManyItemQuery).expect(
      '{"data":{"updateManyItem":{"count":1}}}\n',
    );
  });
  it('should throw error for update many item by user', () => {
    return requestItemMutation('USER', updateManyItemQuery).expect(
      expectAccessDenied,
    );
  });

  it('should delete many item by admin', () => {
    return requestItemMutation('ADMIN', deleteManyItemQuery).expect(
      '{"data":{"deleteManyItem":{"count":1}}}\n',
    );
  });
  it('should throw error for delete many item by user', () => {
    return requestItemMutation('USER', deleteManyItemQuery).expect(
      expectAccessDenied,
    );
  });

  it('should get item with creation date by admin', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: 'ADMIN' })
      .send({ query: '{ items { id createdAt } }' })
      .expect(
        '{"data":{"items":[{"id":"1","createdAt":"2000-01-01T00:00:00.000Z"}]}}\n',
      );
  });
  it('should throw error for get item with creation date by user', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: 'USER' })
      .send({ query: '{ items { id createdAt } }' })
      .expect(expectAccessDenied);
  });

  it('should get item with update date by admin', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: 'ADMIN' })
      .send({ query: '{ items { id updatedAt } }' })
      .expect(
        '{"data":{"items":[{"id":"1","updatedAt":"2000-01-01T00:00:00.000Z"}]}}\n',
      );
  });
  it('should throw error for get user with update date by user', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: 'USER' })
      .send({ query: '{ items { id updatedAt } }' })
      .expect(expectAccessDenied);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
