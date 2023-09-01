import { BucketItemStat, Client, ClientOptions } from 'minio';

export const minioConfig = {
  S3_PORT: 1,
  S3_HOST: 'endpoint',
  S3_ROOT_USER: 'access',
  S3_ROOT_PASSWORD: 'secret',
  S3_BUCKET: 'bucket',
  S3_PATH_IMAGE: 'path/%id',
};

jest.mock('minio', () => ({
  Client: jest
    .fn<Partial<Client>, [ClientOptions]>()
    .mockImplementation((options) => {
      let files: any[] = [];

      if (
        options.port !== minioConfig.S3_PORT ||
        options.endPoint !== minioConfig.S3_HOST ||
        options.accessKey !== minioConfig.S3_ROOT_USER ||
        options.secretKey !== minioConfig.S3_ROOT_PASSWORD
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
