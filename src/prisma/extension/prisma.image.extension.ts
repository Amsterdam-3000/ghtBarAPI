import { Prisma } from '@prisma/client';

import { ImageUpload } from '../../image/image.upload';
import { MinioClient } from '../../minio/minio.client';
import { LoggerService } from '../../logger/logger.service';

export const ImageValidation = () =>
  Prisma.defineExtension((client) => {
    return client.$extends({
      query: {
        $allModels: {
          $allOperations: async ({ args, query }) => {
            if (args['uploadImage'] && args['deleteImage']) {
              throw new Error(
                'Cannot upload and delete image at the same time',
              );
            }
            return query(args);
          },
        },
      },
    });
  });

export const ImageUploading = (minio: MinioClient, logger: LoggerService) =>
  Prisma.defineExtension((client) => {
    //TODO Need to add type?
    const uploadImage = async ({ model, args, query }) => {
      if (!args.hasOwnProperty('uploadImage')) {
        return query(args);
      }

      const uploadImage = new ImageUpload(args.uploadImage, logger);
      await uploadImage.uploadOrThrow();

      delete args.uploadImage;
      const data = await query(args);
      if (!data.id) return data;

      const id = data.id as string;
      logger.log(`Uploading ${model}(${id}) image for create/update/upsert`);

      uploadImage.filename = `${model.toLowerCase()}/${id}`;
      minio
        .putImage(uploadImage)
        .catch((error) =>
          logger.error(
            `Upload ${model}(${id}) image for create/update/upsert failed: ${
              (error as Error).message
            }`,
          ),
        );
      return data;
    };

    return client.$extends({
      query: {
        $allModels: {
          create: uploadImage,
          update: uploadImage,
          upsert: uploadImage,
          createMany: async ({ model, args, query }) => {
            if (!args.hasOwnProperty('uploadImages')) return query(args);

            const uploads = args['uploadImages'];
            const uplImages: ImageUpload[] = uploads.map(
              (upl) => new ImageUpload(upl, logger),
            );
            await Promise.all(uplImages.map((upl) => upl.uploadOrThrow()));

            delete args['uploadImages'];
            const data = await query(args);
            if (data['count'] === 0 || uplImages.length === 0) return data;
            if (!args['data'] || !args['data'][0]?.name) return data;

            const names = (args['data'] as { name: string }[]).map(
              (entry) => entry.name,
            );
            //TODO Need to change to promise (there is problem with fc stream)
            const entries = await client[model.toLowerCase()].findMany({
              where: { name: { in: names } },
            });
            if (!entries.length || !entries[0]?.id || !entries[0]?.name)
              return data;

            const putImages = entries.map(
              (entry: { id: string; name: string }) => {
                const uplImage = uplImages.find(
                  (upl) => upl.name === entry.name,
                );
                if (!uplImage) return;
                uplImage.filename = `${model.toLowerCase()}/${entry.id}`;
                return minio.putImage(uplImage);
              },
            );

            const ids = entries.map((entry) => entry.id as string);
            logger.log(
              `Uploading ${model}[${JSON.stringify(
                ids,
              )}] images for createMany`,
            );

            Promise.all(putImages).catch((error) =>
              logger.error(
                `Upload ${model}[${JSON.stringify(ids)}] images failed: ${
                  (error as Error).message
                }`,
              ),
            );

            return data;
          },
        },
      },
    });
  });

export const ImageDeleting = (minio: MinioClient, logger: LoggerService) =>
  Prisma.defineExtension((client) => {
    //TODO Need to add type?
    const deleteImageForUpdate = async ({ model, args, query }) => {
      if (!args.hasOwnProperty('deleteImage')) {
        return query(args);
      }

      const deleteImage = args.deleteImage as boolean;
      delete args.deleteImage;

      const data = await query(args);
      if (!deleteImage || !data.id) return data;

      const id = data.id as string;
      logger.log(`Deleting ${model}(${id}) image for update/upsert`);

      const imageId = `${model.toLowerCase()}/${id}`;
      minio
        .deleteImage(imageId)
        .catch((error) =>
          logger.error(
            `Deletion ${model}(${id}) image for update/upsert failed: ${
              (error as Error).message
            }`,
          ),
        );

      return data;
    };

    return client.$extends({
      query: {
        $allModels: {
          update: deleteImageForUpdate,
          upsert: deleteImageForUpdate,
          delete: async ({ model, args, query }) => {
            const data = await query(args);
            if (!data.id) return data;

            const id = data.id as string;
            logger.log(`Deleting ${model}(${id}) image for delete`);

            const imageId = `${model.toLowerCase()}/${id}`;
            minio
              .deleteImage(imageId)
              .catch((error) =>
                logger.error(
                  `Deletion ${model}(${id}) image for delete failed: ${
                    (error as Error).message
                  }`,
                ),
              );

            return data;
          },
          deleteMany: async ({ model, args, query }) => {
            //We need ids before delete
            const entries = await client[model.toLowerCase()].findMany(args);
            const data = await query(args);

            if (data['count'] === 0 || !entries[0]?.id) return data;

            const ids = entries.map((entry) => entry.id as string);
            logger.log(
              `Deleting ${model}[${JSON.stringify(ids)}] images for deleteMany`,
            );

            const imageIds = ids.map((id) => `${model.toLowerCase()}/${id}`);
            minio
              .deleteImages(imageIds)
              .catch((error) =>
                logger.error(
                  `Deletion ${model}[${JSON.stringify(ids)}] images: ${
                    (error as Error).message
                  }`,
                ),
              );

            return data;
          },
        },
      },
    });
  });
