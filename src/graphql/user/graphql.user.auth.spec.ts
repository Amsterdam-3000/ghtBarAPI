import * as request from 'supertest';
import { ResolverData } from 'type-graphql';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { Role } from '@prisma/client';

import { PrismaClientExtended } from '../../prisma/prisma';
import { IAppContext } from '../../app/app.model';
import { GraphqlUserModule } from './graphql.user.module';

const user = {
  id: '1',
  name: 'user',
  email: 'user@test.com',
  role: Role.USER,
  password: 'password',
  createdAt: new Date('2000-01-01T00:00:00.000Z'),
  updatedAt: new Date('2000-01-01T00:00:00.000Z'),
};

const createUserQuery =
  'mutation Mutation($data: UserCreateInput!)' +
  '{ createOneUser(data: $data) { id name } }';
const updateUserQuery =
  'mutation Mutation($data: UserUpdateInput!, $where: UserWhereUniqueInput!)' +
  '{ updateOneUser(data: $data, where: $where) { id name } }';
const deleteUserQuery =
  'mutation Mutation($where: UserWhereUniqueInput!)' +
  '{ deleteOneUser(where: $where) { id name } }';
const updateManyUserQuery =
  'mutation Mutation($data: UserUpdateManyMutationInput!, $where: UserWhereInput)' +
  '{ updateManyUser(data: $data, where: $where) { count } }';
const deleteManyUserQuery =
  'mutation Mutation($where: UserWhereInput)' +
  '{ deleteManyUser(where: $where) { count } }';

const getUserQueryVars = (query: string) => {
  const userData = {
    name: 'user1',
    email: 'user@test.com',
    password: '!QAZ1qaz',
  };
  const userUnique = { id: '1' };
  const userFilter = { name: { equals: 'user' } };
  switch (query) {
    case createUserQuery:
      return { data: userData };
    case updateUserQuery:
      return { where: userUnique, data: userData };
    case deleteUserQuery:
      return { where: userUnique };
    case updateManyUserQuery:
      return { data: userData, where: userFilter };
    case deleteManyUserQuery:
      return { where: userFilter };
  }
};

const expectAccessDenied = (res: request.Response) => {
  expect(res.body.errors).toBeArrayOfSize(1);
  expect(res.body.errors[0].message).toBe(
    "Access denied! You don't have permission for this action!",
  );
};

describe('GraphqlUserAuth', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  const requestUserMutation = (role: string, query: string) => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: role })
      .send({
        operationName: 'Mutation',
        query: query,
        variables: getUserQueryVars(query),
      });
  };

  beforeAll(async () => {
    prisma = mockDeep<PrismaClientExtended>();
    prisma.user.create.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(user);
    prisma.user.delete.mockResolvedValue(user);
    prisma.user.upsert.mockResolvedValue(user);
    prisma.user.createMany.mockResolvedValue({ count: 1 });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.deleteMany.mockResolvedValue({ count: 1 });
    prisma.user.findMany.mockResolvedValue([user]);

    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: async () => ({
            authChecker: (data: ResolverData<IAppContext>, roles: string[]) =>
              roles.includes(data.context.req.query.role as string),
            context: () => ({ prisma: prisma }),
          }),
          imports: [GraphqlUserModule],
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should create user by user agent', () => {
    return requestUserMutation('AGENT_USER', createUserQuery).expect(
      '{"data":{"createOneUser":{"id":"1","name":"user"}}}\n',
    );
  });
  it('should throw error for create user by user', () => {
    return requestUserMutation('USER', createUserQuery).expect(
      expectAccessDenied,
    );
  });

  it('should update user by admin', () => {
    return requestUserMutation('ADMIN', updateUserQuery).expect(
      '{"data":{"updateOneUser":{"id":"1","name":"user"}}}\n',
    );
  });
  it('should update user by user', () => {
    return requestUserMutation('USER', updateUserQuery).expect(
      '{"data":{"updateOneUser":{"id":"1","name":"user"}}}\n',
    );
  });
  it('should throw error for update user by unknown', () => {
    return requestUserMutation('', updateUserQuery).expect(expectAccessDenied);
  });

  it('should delete user by admin', () => {
    return requestUserMutation('ADMIN', deleteUserQuery).expect(
      '{"data":{"deleteOneUser":{"id":"1","name":"user"}}}\n',
    );
  });
  it('should delete user by user', () => {
    return requestUserMutation('USER', deleteUserQuery).expect(
      '{"data":{"deleteOneUser":{"id":"1","name":"user"}}}\n',
    );
  });
  it('should throw error for delete user by unknown', () => {
    return requestUserMutation('', deleteUserQuery).expect(expectAccessDenied);
  });

  it('should update many user by admin', () => {
    return requestUserMutation('ADMIN', updateManyUserQuery).expect(
      '{"data":{"updateManyUser":{"count":1}}}\n',
    );
  });
  it('should throw error for update many user by user', () => {
    return requestUserMutation('USER', updateManyUserQuery).expect(
      expectAccessDenied,
    );
  });

  it('should delete many user by admin', () => {
    return requestUserMutation('ADMIN', deleteManyUserQuery).expect(
      '{"data":{"deleteManyUser":{"count":1}}}\n',
    );
  });
  it('should throw error for delete many user by user', () => {
    return requestUserMutation('USER', deleteManyUserQuery).expect(
      expectAccessDenied,
    );
  });

  it('should get user with email by admin', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: 'ADMIN' })
      .send({ query: '{ users { id email } }' })
      .expect('{"data":{"users":[{"id":"1","email":"user@test.com"}]}}\n');
  });
  it('should get user with email by user', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: 'USER' })
      .send({ query: '{ users { id email } }' })
      .expect('{"data":{"users":[{"id":"1","email":"user@test.com"}]}}\n');
  });
  it('should throw error for get user with email by unknown', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ users { id email } }' })
      .expect(expectAccessDenied);
  });

  it('should get user with creation date by admin', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: 'ADMIN' })
      .send({ query: '{ users { id createdAt } }' })
      .expect(
        '{"data":{"users":[{"id":"1","createdAt":"2000-01-01T00:00:00.000Z"}]}}\n',
      );
  });
  it('should throw error for get user with creation date by user', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: 'USER' })
      .send({ query: '{ users { id createdAt } }' })
      .expect(expectAccessDenied);
  });

  it('should get user with update date by admin', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: 'ADMIN' })
      .send({ query: '{ users { id updatedAt } }' })
      .expect(
        '{"data":{"users":[{"id":"1","updatedAt":"2000-01-01T00:00:00.000Z"}]}}\n',
      );
  });
  it('should throw error for get user with update date by user', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .query({ role: 'USER' })
      .send({ query: '{ users { id updatedAt } }' })
      .expect(expectAccessDenied);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
