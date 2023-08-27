import * as request from 'supertest';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';

import { PrismaClientExtended } from '../../prisma/prisma';
import { GraphqlItemModule } from '../item/graphql.item.module';
import { Role } from '@prisma/client';
import { GraphqlUserModule } from './graphql.user.module';

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
const fullUser = {
  id: '4',
  name: 'user',
  email: 'user@test.com',
  role: Role.USER,
  password: 'password',
  createdAt: new Date('2000-01-01T00:00:00.000Z'),
  updatedAt: new Date('2000-01-01T00:00:00.000Z'),
};
const uniqueUser = {
  name: 'user',
};
const validUser = {
  name: 'user',
  email: 'user@test.com',
  password: '!QAZ1qaz',
};
const invalidUserName = {
  name: 'use',
  email: 'user@test.com',
  password: '!QAZ1qaz',
};
const invalidUserEmail = {
  name: 'user',
  email: 'user',
  password: '!QAZ1qaz',
};
const invalidUserPass = {
  name: 'user',
  email: 'user@test.com',
  password: 'pass',
};

const createUserQuery =
  'mutation Mutation($data: UserCreateInput!)' +
  '{ createOneUser(data: $data) { id name } }';
const updateUserQuery =
  'mutation Mutation($data: UserUpdateInput!, $where: UserWhereUniqueInput!)' +
  '{ updateOneUser(data: $data, where: $where) { id name } }';
const updateManyUserQuery =
  'mutation Mutation($data: UserUpdateManyMutationInput!, $where: UserWhereInput)' +
  '{ updateManyUser(data: $data, where: $where) { count } }';

const getUserQueryVars = (query: string, data: object) => {
  switch (query) {
    case createUserQuery:
      return { data: data };
    case updateUserQuery:
      return { where: { name: 'user' }, data: data };
    case updateManyUserQuery:
      return { data: data, where: { name: { equals: 'user' } } };
  }
};

const createItemQuery =
  'mutation Mutation($data: ItemCreateInput!)' +
  '{ createOneItem(data: $data) { id userId } }';
const updateItemQuery =
  'mutation Mutation($data: ItemUpdateInput!, $where: ItemWhereUniqueInput!)' +
  '{ updateOneItem(data: $data, where: $where) { id userId } }';
const upsertItemQuery =
  'mutation Mutation($where: ItemWhereUniqueInput!, $create: ItemCreateInput!, $update: ItemUpdateInput!)' +
  '{ upsertOneItem(where: $where, create: $create, update: $update) { id userId } }';

const connectUser = { connect: uniqueUser };
const createUser = { create: validUser };
const connectOrCreateUser = {
  connectOrCreate: { where: uniqueUser, create: validUser },
};
const deleteUser = { delete: { name: { equals: 'user' } } };
const updateUser = { update: { data: validUser } };
const upsertUser = { create: validUser, update: { data: validUser } };

const getItemQueryUserVars = (query: string, data1: object, data2?: object) => {
  const itemData = { name: 'item', user: data1 };
  const itemData2 = { name: 'item', user: data2 };
  switch (query) {
    case createItemQuery:
      return { data: itemData };
    case updateItemQuery:
      return { where: { id: '4' }, data: itemData };
    case upsertItemQuery:
      return { where: { id: '4' }, create: itemData, update: itemData2 };
  }
};

const expectValidationError = (res: request.Response) => {
  expect(res.body.errors).toBeArrayOfSize(1);
  expect(res.body.errors[0].message).toBe('Argument Validation Error');
};

describe('GraphqlUserValidation', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  const requestMutation = (query: string, data: object, data2?: object) => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: 'Mutation',
        query: query,
        variables: query.includes('User')
          ? getUserQueryVars(query, data)
          : getItemQueryUserVars(query, data, data2),
      });
  };

  beforeAll(async () => {
    prisma = mockDeep<PrismaClientExtended>();
    prisma.user.create.mockResolvedValue(fullUser);
    prisma.user.update.mockResolvedValue(fullUser);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
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
          imports: [GraphqlUserModule, GraphqlItemModule],
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should create user', () => {
    return requestMutation(createUserQuery, validUser).expect(
      '{"data":{"createOneUser":{"id":"4","name":"user"}}}\n',
    );
  });
  it('should throw error for creation invalid user name', () => {
    return requestMutation(createUserQuery, invalidUserName).expect(
      expectValidationError,
    );
  });
  it('should throw error for creation invalid user email', () => {
    return requestMutation(createUserQuery, invalidUserEmail).expect(
      expectValidationError,
    );
  });
  it('should throw error for creation invalid user password', () => {
    return requestMutation(createUserQuery, invalidUserPass).expect(
      expectValidationError,
    );
  });

  it('should update user', () => {
    return requestMutation(updateUserQuery, validUser).expect(
      '{"data":{"updateOneUser":{"id":"4","name":"user"}}}\n',
    );
  });
  it('should throw error for update invalid user name', () => {
    return requestMutation(updateUserQuery, invalidUserName).expect(
      expectValidationError,
    );
  });
  it('should throw error for update invalid user email', () => {
    return requestMutation(updateUserQuery, invalidUserEmail).expect(
      expectValidationError,
    );
  });
  it('should throw error for update invalid user password', () => {
    return requestMutation(updateUserQuery, invalidUserPass).expect(
      expectValidationError,
    );
  });

  it('should update many user', () => {
    return requestMutation(updateManyUserQuery, validUser).expect(
      '{"data":{"updateManyUser":{"count":1}}}\n',
    );
  });
  it('should throw error for update many invalid user name', () => {
    return requestMutation(updateManyUserQuery, invalidUserName).expect(
      expectValidationError,
    );
  });
  it('should throw error for update many invalid user email', () => {
    return requestMutation(updateManyUserQuery, invalidUserEmail).expect(
      expectValidationError,
    );
  });
  it('should throw error for update many invalid user password', () => {
    return requestMutation(updateManyUserQuery, invalidUserPass).expect(
      expectValidationError,
    );
  });

  it('should create item with connection to user', () => {
    return requestMutation(createItemQuery, connectUser).expect(
      '{"data":{"createOneItem":{"id":"1","userId":"4"}}}\n',
    );
  });
  it('should throw error for creation item with user', () => {
    return requestMutation(createItemQuery, createUser).expect(
      expectValidationError,
    );
  });
  it('should throw error for creation (connection) item with user', () => {
    return requestMutation(createItemQuery, connectOrCreateUser).expect(
      expectValidationError,
    );
  });

  it('should update item with connection to user', () => {
    return requestMutation(updateItemQuery, connectUser).expect(
      '{"data":{"updateOneItem":{"id":"1","userId":"4"}}}\n',
    );
  });
  it('should throw error for update item with creation user', () => {
    return requestMutation(updateItemQuery, createUser).expect(
      expectValidationError,
    );
  });
  it('should throw error for update item with creation (connection) user', () => {
    return requestMutation(updateItemQuery, connectOrCreateUser).expect(
      expectValidationError,
    );
  });
  it('should throw error for update item with deletion user', () => {
    return requestMutation(updateItemQuery, deleteUser).expect(
      expectValidationError,
    );
  });
  it('should throw error for update item with update user', () => {
    return requestMutation(updateItemQuery, updateUser).expect(
      expectValidationError,
    );
  });
  it('should throw error for update item with upsert user', () => {
    return requestMutation(updateItemQuery, upsertUser).expect(
      expectValidationError,
    );
  });

  it('should upsert item with connection to user', () => {
    return requestMutation(upsertItemQuery, connectUser, connectUser).expect(
      '{"data":{"upsertOneItem":{"id":"1","userId":"4"}}}\n',
    );
  });
  it('should throw error for upsert item with create user', () => {
    return requestMutation(upsertItemQuery, createUser, connectUser).expect(
      expectValidationError,
    );
  });
  it('should throw error for upsert item with create (connection) user', () => {
    return requestMutation(
      upsertItemQuery,
      connectOrCreateUser,
      connectUser,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with update (create) user', () => {
    return requestMutation(upsertItemQuery, connectUser, createUser).expect(
      expectValidationError,
    );
  });
  it('should throw error for upsert item with update (create (connection)) user', () => {
    return requestMutation(
      upsertItemQuery,
      connectUser,
      connectOrCreateUser,
    ).expect(expectValidationError);
  });
  it('should throw error for upsert item with update user', () => {
    return requestMutation(upsertItemQuery, connectUser, updateUser).expect(
      expectValidationError,
    );
  });
  it('should throw error for upsert item with update (delete) user', () => {
    return requestMutation(upsertItemQuery, connectUser, deleteUser).expect(
      expectValidationError,
    );
  });
  it('should throw error for upsert item with update (upsert) user', () => {
    return requestMutation(upsertItemQuery, connectUser, upsertUser).expect(
      expectValidationError,
    );
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
