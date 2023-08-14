import * as request from 'supertest';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
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

const createItemQuery =
  'mutation Mutation($data: ItemCreateInput!, $uploadImage: Upload)' +
  '{ createOneItem(data: $data, uploadImage: $uploadImage) { id name } }';
const updateItemQuery =
  'mutation Mutation($data: ItemUpdateInput!, $where: ItemWhereUniqueInput!, $uploadImage: Upload, $deleteImage: Boolean)' +
  '{ updateOneItem(data: $data, where: $where, uploadImage: $uploadImage, deleteImage: $deleteImage) { id name } }';
const upsertItemQuery =
  'mutation Mutation($where: ItemWhereUniqueInput!, $create: ItemCreateInput!, $update: ItemUpdateInput!, $uploadImage: Upload, $deleteImage: Boolean)' +
  '{ upsertOneItem(where: $where, create: $create, update: $update, uploadImage: $uploadImage, deleteImage: $deleteImage) { id name } }';
const createManyItemQuery =
  'mutation Mutation($data: [ItemCreateManyInput!]!, $uploadImages: [Upload!])' +
  '{ createManyItem(data: $data, uploadImages: $uploadImages) { count } }';

const getItemQueryVars = (query: string, image = null, del: any = false) => {
  switch (query) {
    case createItemQuery:
      return { data: validItem, uploadImage: image };
    case updateItemQuery:
      return {
        where: uniqueItem,
        data: validItem,
        uploadImage: image,
        deleteImage: del,
      };
    case upsertItemQuery:
      return {
        where: uniqueItem,
        create: validItem,
        update: validItem,
        uploadImage: image,
        deleteImage: del,
      };
    case createManyItemQuery:
      return { data: [validItem], uploadImages: [image, image] };
  }
};

const csrfMessage =
  'This operation has been blocked as a potential Cross-Site Request Forgery (CSRF).';
const fileMissingMessage = 'File missing in the request.';
const invalidImageMessage = 'Upload value invalid.';
const invalidBooleanMessage = 'Boolean cannot represent a non boolean value:';

const expectValidationError = (message: string) => (res: request.Response) => {
  expect(res.body.errors).toBeArray();
  expect(res.body.errors[0].message).toContain(message);
};

describe('GraphqlItemUpload', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  const requestItemUploadMutation = (
    query: string,
    file = 0,
    preflight = true,
  ) => {
    const req = request(app.getHttpServer())
      .post('/graphql')
      .set('apollo-require-preflight', preflight ? 'true' : '')
      .field(
        'operations',
        `{"query":"${query}","operationName":"Mutation","variables":${JSON.stringify(
          getItemQueryVars(query),
        )}}`,
      );
    if (query === createManyItemQuery) {
      return req
        .field(
          'map',
          '{"0":["variables.uploadImages.0"],"1":["variables.uploadImages.1"]}',
        )
        .attach(file.toString(), Buffer.alloc(0))
        .attach('1', Buffer.alloc(1));
    } else {
      return req
        .field('map', '{"0":["variables.uploadImage"]}')
        .attach(file.toString(), Buffer.alloc(0));
    }
  };

  const requestItemMutation = (
    query: string,
    image = null,
    del: any = false,
  ) => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: 'Mutation',
        query: query,
        variables: getItemQueryVars(query, image, del),
      });
  };

  beforeAll(async () => {
    prisma = mockDeep<PrismaClientExtended>();
    prisma.item.create.mockResolvedValue(fullItem);
    prisma.item.update.mockResolvedValue(fullItem);
    prisma.item.upsert.mockResolvedValue(fullItem);
    prisma.item.createMany.mockResolvedValue({ count: 1 });

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
    app.use(graphqlUploadExpress());
    await app.init();
  });

  it('should create item with image', () => {
    return requestItemUploadMutation(createItemQuery).expect(
      '{"data":{"createOneItem":{"id":"1","name":"item"}}}\n',
    );
  });
  it('should throw error for creation with upload without preflight', () => {
    return requestItemUploadMutation(createItemQuery, 0, false).expect(
      expectValidationError(csrfMessage),
    );
  });
  it('should throw error for creation with upload without file', () => {
    return requestItemUploadMutation(createItemQuery, 1).expect(
      expectValidationError(fileMissingMessage),
    );
  });
  it('should throw error for creation with upload with invalid uploadImage', () => {
    return requestItemMutation(createItemQuery, '1').expect(
      expectValidationError(invalidImageMessage),
    );
  });

  it('should update item with image', () => {
    return requestItemUploadMutation(updateItemQuery).expect(
      '{"data":{"updateOneItem":{"id":"1","name":"item"}}}\n',
    );
  });
  it('should throw error for update with upload without preflight', () => {
    return requestItemUploadMutation(updateItemQuery, 0, false).expect(
      expectValidationError(csrfMessage),
    );
  });
  it('should throw error for update with upload without file', () => {
    return requestItemUploadMutation(updateItemQuery, 1).expect(
      expectValidationError(fileMissingMessage),
    );
  });
  it('should throw error for update with invalid uploadImage', () => {
    return requestItemMutation(updateItemQuery, '1').expect(
      expectValidationError(invalidImageMessage),
    );
  });
  it('should throw error for update with invalid deleteImage', () => {
    return requestItemMutation(updateItemQuery, null, '1').expect(
      expectValidationError(invalidBooleanMessage),
    );
  });

  it('should upsert item with image', () => {
    return requestItemUploadMutation(upsertItemQuery).expect(
      '{"data":{"upsertOneItem":{"id":"1","name":"item"}}}\n',
    );
  });
  it('should throw error for upsert with upload without preflight', () => {
    return requestItemUploadMutation(upsertItemQuery, 0, false).expect(
      expectValidationError(csrfMessage),
    );
  });
  it('should throw error for upsert with upload without file', () => {
    return requestItemUploadMutation(upsertItemQuery, 1).expect(
      expectValidationError(fileMissingMessage),
    );
  });
  it('should throw error for upsert with invalid uploadImage', () => {
    return requestItemMutation(upsertItemQuery, '1').expect(
      expectValidationError(invalidImageMessage),
    );
  });
  it('should throw error for upsert with invalid deleteImage', () => {
    return requestItemMutation(upsertItemQuery, null, '1').expect(
      expectValidationError(invalidBooleanMessage),
    );
  });

  it('should create many item with many image', () => {
    return requestItemUploadMutation(createManyItemQuery).expect(
      '{"data":{"createManyItem":{"count":1}}}\n',
    );
  });
  it('should throw error for creation many with upload without preflight', () => {
    return requestItemUploadMutation(createManyItemQuery, 0, false).expect(
      expectValidationError(csrfMessage),
    );
  });
  it('should throw error for creation many with upload without file', () => {
    return requestItemUploadMutation(createManyItemQuery, 1).expect(
      expectValidationError(fileMissingMessage),
    );
  });
  it('should throw error for creation many with upload with invalid uploadImage', () => {
    return requestItemMutation(createManyItemQuery, '1').expect(
      expectValidationError(invalidImageMessage),
    );
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
