import * as bcrypt from 'bcrypt';
import {
  Country,
  Item,
  PrismaClient as PrismaClientBase,
  User,
} from '@prisma/client';

import { ImageFlag } from '../image/image.flag.model';
import { ImageProxy } from '../image/image.proxy.model';
import { ImageUpload } from '../image/image.upload.model';
import { minioService } from '../minio/minio.service';

const prismaBase = new PrismaClientBase();

//Check only one operation for upload/delete image
prismaBase.$use(async (params, next) => {
  if (params.args.uploadImage && params.args.deleteImage) {
    throw new Error('Cannot upload and delete image at the same time');
  }
  return next(params);
});

//Upload image while create/update/upsert any entity
prismaBase.$use(async (params, next) => {
  if (!params.args?.hasOwnProperty('uploadImage')) {
    return next(params);
  }
  const uploadImage = new ImageUpload(params.args.uploadImage);
  await uploadImage.uploadOrThrow();
  delete params.args.uploadImage;
  const data = await next(params);
  uploadImage.filename = `${params.model}/${data.id}`;
  minioService.putImage(uploadImage).catch();
  return data;
});

//Delete image while update/upsert any entity
prismaBase.$use(async (params, next) => {
  if (!params.args?.hasOwnProperty('deleteImage')) {
    return next(params);
  }
  const deleteImage = params.args.deleteImage;
  delete params.args.deleteImage;
  const data = await next(params);
  const imageId = `${params.model}/${data.id}`;
  if (deleteImage) minioService.deleteImage(imageId).catch();
  return data;
});

//Upload images while createMany any entity
prismaBase.$use(async (params, next) => {
  if (!params.args?.hasOwnProperty('uploadImages')) {
    return next(params);
  }
  const uploadImages = params.args.uploadImages.map(
    (uploadImage) => new ImageUpload(uploadImage),
  );
  await Promise.all(
    uploadImages.map((uploadImage) => uploadImage.uploadOrThrow()),
  );
  delete params.args.uploadImages;
  const data = await next(params);
  if (data.count !== 0 && uploadImages.length !== 0) {
    //TODO Need to change to promise (there is problem with fc stream)
    const entries = await prismaBase[params.model.toLowerCase()].findMany({
      where: { name: { in: params.args.data.map((entry) => entry.name) } },
    });
    Promise.all(
      entries.map((entry) => {
        const uploadImage = uploadImages.find(
          (uploadImage) => uploadImage.name === entry.name,
        );
        if (!uploadImage) return;
        uploadImage.filename = `${params.model}/${entry.id}`;
        return minioService.putImage(uploadImage);
      }),
    ).catch();
  }
  return data;
});

//Delete image while delete any entity
prismaBase.$use(async (params, next) => {
  if (params.action !== 'delete') {
    return next(params);
  }
  const data = await next(params);
  const imageId = `${params.model}/${data.id}`;
  minioService.deleteImage(imageId).catch();
  return data;
});

//Delete images while deleteMany any entity
prismaBase.$use(async (params, next) => {
  if (params.action !== 'deleteMany') {
    return next(params);
  }
  //We need ids before delete
  const entries = await prismaBase[params.model.toLowerCase()].findMany({
    ...params.args,
  });
  const data = await next(params);
  if (data.count !== 0) {
    const imageIds = entries.map((entry) => `${params.model}/${entry.id}`);
    minioService.deleteImages(imageIds).catch();
  }
  return data;
});

//TODO Move to keycloak service
prismaBase.$use(async (params, next) => {
  if (params.model === 'User' && params.args?.data?.password) {
    const password = params.args.data.password;
    params.args.data.password = await bcrypt.hash(password, 10);
  }
  return next(params);
});

export const prisma = prismaBase.$extends({
  model: {
    //TODO Move to keycloak service
    user: {
      signIn: async (username: string, password: string): Promise<User> => {
        const user = await prisma.user.findUniqueOrThrow({
          where: { name: username },
        });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }
        return user;
      },
    },
  },
  result: {
    country: {
      image: {
        needs: { id: true },
        compute: (country) => new ImageFlag(country.id).getImageUrls(),
      },
    },
    item: {
      image: {
        needs: { id: true },
        compute: (item) => new ImageProxy(`Item/${item.id}`).getImageUrls(),
      },
    },
  },
  query: {
    //TODO Remove this computations (Prisma extension has a bug with computed fields)
    $allModels: {
      $allOperations: async ({ model, operation, args, query }) => {
        if (args['select'] && args['select']['country']) {
          const country = (await query(args)) as Country;
          if (country['country'] || country['image']) return country;
          country['image'] = new ImageFlag(country.id).getImageUrls();
          return country;
        }
        if (args['select'] && args['select']['items']) {
          const items = (await query(args)) as Item[];
          if (!items.length) return items;
          items.forEach((item) => {
            if (item['image']) return;
            item['image'] = new ImageProxy(`Item/${item.id}`).getImageUrls();
          });
          return items as any;
        }
        return query(args);
      },
    },
  },
});

export type PrismaClient = typeof prisma;
