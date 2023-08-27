import { Prisma } from '@prisma/client';

import { IImageUpload, ImageUpload } from '../../image/image.upload';
import { MinioClient } from '../../minio/minio.client';
import { LoggerService } from '../../logger/logger.service';

export const ImageValidation = () =>
  Prisma.defineExtension((client) =>
    client.$extends({
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
    }),
  );

//TODO Need to add type?
const uploadImage =
  (minio: MinioClient, logger: LoggerService) =>
  async ({ model, args, query }) => {
    const image = args.uploadImage as IImageUpload;
    if (args.hasOwnProperty('uploadImage')) delete args.uploadImage;

    const data = await query(args);

    if (image && data.id) {
      const uploadImage = new ImageUpload(image, logger);
      await uploadImage.uploadOrThrow();

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
    }

    return data;
  };

export const ImageUploading = (minio: MinioClient, logger: LoggerService) =>
  Prisma.defineExtension((client) =>
    client.$extends({
      query: {
        $allModels: {
          create: uploadImage(minio, logger),
          update: uploadImage(minio, logger),
          upsert: uploadImage(minio, logger),
          createMany: async ({ model, args, query }) => {
            const uploads: IImageUpload[] = args['uploadImages'];
            if (args.hasOwnProperty('uploadImages'))
              delete args['uploadImages'];

            const data = await query(args);

            if (
              uploads?.length &&
              data['count'] !== 0 &&
              args['data'] &&
              args['data'][0]?.name
            ) {
              const uplImages: ImageUpload[] = uploads.map(
                (upl) => new ImageUpload(upl, logger),
              );
              await Promise.all(uplImages.map((upl) => upl.uploadOrThrow()));

              const names = (args['data'] as { name: string }[]).map(
                (entry) => entry.name,
              );
              //TODO Need to change to promise (there is problem with fc stream)
              const entries = await client[model.toLowerCase()].findMany({
                where: { name: { in: names } },
              });

              if (entries.length && entries[0]?.id && !entries[0]?.name) {
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
              }
            }

            return data;
          },
        },
      },
    }),
  );

//TODO Need to add type?
const deleteImageForUpdate =
  (minio: MinioClient, logger: LoggerService) =>
  async ({ model, args, query }) => {
    const deleteImage = args.deleteImage as boolean;
    if (args.hasOwnProperty('deleteImage')) delete args.deleteImage;

    const data = await query(args);

    if (deleteImage && data.id) {
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
    }

    return data;
  };

export const ImageDeleting = (minio: MinioClient, logger: LoggerService) =>
  Prisma.defineExtension((client) =>
    client.$extends({
      query: {
        $allModels: {
          update: deleteImageForUpdate(minio, logger),
          upsert: deleteImageForUpdate(minio, logger),
          delete: async ({ model, args, query }) => {
            const data = await query(args);
            if (data.id) {
              const id = data.id;
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
            }

            return data;
          },
          deleteMany: async ({ model, args, query }) => {
            //We need ids before delete
            const entries = await client[model.toLowerCase()].findMany(args);
            const data = await query(args);

            if (data['count'] !== 0 && entries[0]?.id) {
              const ids = entries.map((entry) => entry.id as string);
              logger.log(
                `Deleting ${model}[${JSON.stringify(
                  ids,
                )}] images for deleteMany`,
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
            }

            return data;
          },
        },
      },
    }),
  );
