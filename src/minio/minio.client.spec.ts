import { minioConfig } from './minio.mock';

import { ConfigService } from '@nestjs/config';

import { LoggerServiceMock } from '../logger/logger.mock';
import { IImageUpload, ImageUpload } from '../image/image.upload';
import { MinioClient as MinioClientOrigin } from './minio.client';

jest.mock('../image/image.upload', () => ({
  ImageUpload: jest.fn<Partial<ImageUpload>, [IImageUpload]>((upload) => ({
    stream: upload.createReadStream && upload.createReadStream(),
    mimetype: upload.mimetype,
    filename: upload.filename,
  })),
}));

export class MinioClient extends MinioClientOrigin {
  getBucket = () => this.bucket;
  getPath = () => this.imagePath;
  getMinio = () => this.minioClient;
}

describe('MinioClient', () => {
  let logger: LoggerServiceMock;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = new LoggerServiceMock();
  });

  describe('Config', () => {
    it('should minio throw error with wrong config', async () => {
      const config = new ConfigService({});
      expect(() => new MinioClient(config, logger)).toThrow();
    });
    it('should not minio throw error with right config', async () => {
      const config = new ConfigService({ ...minioConfig });
      expect(() => new MinioClient(config, logger)).not.toThrow();
    });
    it('should minioService has right config', async () => {
      const config = new ConfigService({ ...minioConfig });
      const minioService = new MinioClient(config, logger);
      expect(minioService.getBucket()).toBe(minioConfig.S3_BUCKET);
      expect(minioService.getPath()).toBe(minioConfig.S3_PATH_IMAGE);
    });
  });

  describe('Service', () => {
    let bucket: string;
    let minioClient: MinioClient;
    let upload1: ImageUpload;
    let upload2: ImageUpload;
    let path1: string;
    let path2: string;

    beforeEach(() => {
      const config = new ConfigService({ ...minioConfig });
      minioClient = new MinioClient(config, logger);
      bucket = minioClient.getBucket();
      upload1 = new ImageUpload(
        {
          filename: 'filename1',
          mimetype: 'mimetype1',
          createReadStream: () => 'stream1',
        },
        logger,
      );
      upload2 = new ImageUpload({ filename: 'filename2' }, logger);
      path1 = minioClient.getPath().replace('%id', 'filename1');
      path2 = minioClient.getPath().replace('%id', 'filename2');
    });

    describe('putImage', () => {
      it('should throw error with wrong object', async () => {
        const minio = minioClient.getMinio();
        await expect(minio.statObject('', '')).rejects.toBeDefined();
        expect(logger.log).not.toBeCalled();
      });
      it('should get right object', async () => {
        await minioClient.putImage(upload1);
        const minio = minioClient.getMinio();
        const object = await minio.statObject(bucket, path1);
        expect(object.etag).toBe('stream1');
        expect(object.metaData).toMatchObject({
          'Content-Type': 'mimetype1',
        });
      });
      it('should put be logged', async () => {
        await minioClient.putImage(new ImageUpload({}, logger));
        expect(logger.log).toBeCalledTimes(1);
      });
    });

    describe('deleteImage', () => {
      beforeEach(async () => {
        await minioClient.putImage(upload1);
      });
      it('should not be deleted', async () => {
        const minio = minioClient.getMinio();
        await expect(minio.statObject(bucket, path1)).resolves.toBeDefined();
      });
      it('should be deleted', async () => {
        await minioClient.deleteImage('filename1');
        const minio = minioClient.getMinio();
        await expect(minio.statObject(bucket, path1)).rejects.toBeDefined();
      });
      it('should delete be logged', async () => {
        await minioClient.deleteImage('');
        expect(logger.log).toBeCalledTimes(2);
      });
    });

    describe('deleteImages', () => {
      beforeEach(async () => {
        await minioClient.putImage(upload1);
        await minioClient.putImage(upload2);
      });
      it('should not be deleted', async () => {
        const minio = minioClient.getMinio();
        await expect(minio.statObject(bucket, path1)).resolves.toBeDefined();
        await expect(minio.statObject(bucket, path2)).resolves.toBeDefined();
      });
      it('should be one deleted', async () => {
        await minioClient.deleteImages(['filename1']);
        const minio = minioClient.getMinio();
        await expect(minio.statObject(bucket, path1)).rejects.toBeDefined();
        await expect(minio.statObject(bucket, path2)).resolves.toBeDefined();
      });
      it('should be deleted', async () => {
        await minioClient.deleteImages(['filename1']);
        await minioClient.deleteImages(['filename2']);
        const minio = minioClient.getMinio();
        await expect(minio.statObject(bucket, path1)).rejects.toBeDefined();
        await expect(minio.statObject(bucket, path2)).rejects.toBeDefined();
      });
      it('should delete many be logged', async () => {
        await minioClient.deleteImages(['']);
        expect(logger.log).toBeCalledTimes(3);
      });
    });
  });
});
