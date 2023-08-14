import { BucketItemStat, Client, ClientOptions } from 'minio';

export const minioConfig = {
  MINIO_PORT: 1,
  MINIO_ENDPOINT: 'endpoint',
  MINIO_ACCESS_KEY: 'access',
  MINIO_SECRET_KEY: 'secret',
  MINIO_USE_SSL: false,
  MINIO_BUCKET: 'bucket',
  MINIO_PATH_IMAGE: 'path/%id',
};

jest.mock('minio', () => ({
  Client: jest
    .fn<Partial<Client>, [ClientOptions]>()
    .mockImplementation((options) => {
      let files: any[] = [];

      if (
        options.port !== minioConfig.MINIO_PORT ||
        options.endPoint !== minioConfig.MINIO_ENDPOINT ||
        options.accessKey !== minioConfig.MINIO_ACCESS_KEY ||
        options.secretKey !== minioConfig.MINIO_SECRET_KEY ||
        options.useSSL !== minioConfig.MINIO_USE_SSL
      ) {
        throw new Error();
      }

      const getFile = (bucket: string, object: string) => {
        const file = files.find(
          (file) => file.bucket === bucket && file.object === object,
        );
        if (!file) throw new Error();
        return file;
      };

      const removeFile = (bucket: string, object: string) => {
        files = files.filter(
          (file) => file.bucket !== bucket || file.object !== object,
        );
      };

      return {
        statObject: jest.fn<Promise<BucketItemStat>, [string, string]>(
          async (bucket, object) => {
            const file = getFile(bucket, object);
            return {
              etag: file.stream,
              metaData: file.metadata,
              size: 0,
              lastModified: null,
            };
          },
        ),

        putObject: jest.fn<Promise<null>, [string, string, string, any]>(
          async (bucket, object, stream, metadata) => {
            files.push({ bucket, object, stream, metadata });
            return null;
          },
        ),

        removeObject: jest.fn<Promise<void>, [string, string]>(
          async (bucket, object) => {
            removeFile(bucket, object);
          },
        ),

        removeObjects: jest.fn<Promise<void>, [string, string[]]>(
          async (bucket, objects) => {
            objects.forEach((object) => {
              removeFile(bucket, object);
            });
          },
        ),
      };
    }),
}));
