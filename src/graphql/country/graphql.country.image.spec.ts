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
  emoji: 'emoji',
  image: { urlSvg: 'urlSvg' },
};

describe('GraphqlCountryImage', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  beforeAll(async () => {
    prisma = mockDeep<PrismaClientExtended>();
    prisma.country.findMany.mockResolvedValue([country]);
    prisma.item.findMany.mockResolvedValue([item]);
    prisma.item.findUniqueOrThrow.mockReturnValue({
      country: () => country,
    } as any);

    const module = await Test.createTestingModule({
      imports: [
        TypeGraphQLModule.forRootAsync({
          driver: ApolloDriver,
          useFactory: async () => ({
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

  it('should get country with image', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ countries { id image { urlSvg } } }' })
      .expect(200)
      .expect(
        '{"data":{"countries":[{"id":"2","image":{"urlSvg":"urlSvg"}}]}}\n',
      );
  });

  it('should get item with country with image', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ items { id country { id image { urlSvg } } } }' })
      .expect(200)
      .expect(
        '{"data":{"items":[{"id":"1","country":{"id":"2","image":{"urlSvg":"urlSvg"}}}]}}\n',
      );
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
