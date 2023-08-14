import * as request from 'supertest';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';

import { PrismaClientExtended } from '../../prisma/prisma';
import { GraphqlItemModule } from './graphql.item.module';

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

describe('GraphqlItemImage', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  beforeAll(async () => {
    prisma = mockDeep<PrismaClientExtended>();
    prisma.item.findMany.mockResolvedValue([item]);

    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: async () => ({
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

  it('should get item with image', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ items { id image { urlJpg } } }' })
      .expect(200)
      .expect('{"data":{"items":[{"id":"1","image":{"urlJpg":"urlJpg"}}]}}\n');
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
