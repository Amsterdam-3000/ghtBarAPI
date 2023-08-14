import { jest } from '@jest/globals';

import { LoggerServiceMock } from '../logger/logger.mock';
import { ImageUpload } from './image.upload';

//Test experimental features for ESM modules
jest.unstable_mockModule('file-type', async () => {
  return {
    fileTypeFromStream: jest.fn<(string) => Promise<{ mime: string }>>(
      async (stream) => {
        if (!stream) throw new Error();
        return {
          mime: stream,
        };
      },
    ),
  };
});

describe('ImageUpload', () => {
  let logger: LoggerServiceMock;

  beforeEach(async () => {
    jest.clearAllMocks();
    logger = new LoggerServiceMock();
  });

  it('should throw error if upload is null', async () => {
    const upload = new ImageUpload(null, logger);
    await expect(upload.uploadOrThrow()).rejects.toMatchObject({
      message: 'Image must not be null.',
    });
  });

  it('should throw error if upload has error', async () => {
    const upload = new ImageUpload({ createReadStream: () => '' }, logger);
    await expect(upload.uploadOrThrow()).rejects.toMatchObject({
      message: 'Image upload error.',
    });
  });

  it('should throw error if upload not image', async () => {
    const upload = new ImageUpload(
      { createReadStream: () => 'text/css' },
      logger,
    );
    await expect(upload.uploadOrThrow()).rejects.toMatchObject({
      message: 'Image type error.',
    });
  });

  it('should upload image', async () => {
    const upload = new ImageUpload(
      {
        filename: '1.jpg',
        createReadStream: () => 'image/jpeg',
      },
      logger,
    );
    await upload.uploadOrThrow();
    expect(upload.stream).toBe('image/jpeg');
    expect(upload.mimetype).toBe('image/jpeg');
    expect(upload.filename).toBe('1.jpg');
    expect(upload.name).toBe('1');
    upload.filename = '2';
    expect(upload.filename).toBe('2');
  });

  it('should be logged', async () => {
    try {
      await new ImageUpload(null, logger).uploadOrThrow();
    } catch {}
    await new ImageUpload(
      { createReadStream: () => 'image/', filename: '1' },
      logger,
    ).uploadOrThrow();
    expect(logger.log).toBeCalledTimes(2);
  });
});
