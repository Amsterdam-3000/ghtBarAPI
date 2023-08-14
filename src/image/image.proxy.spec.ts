import { BinaryToTextEncoding } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

import { LoggerServiceMock } from '../logger/logger.mock';
import { ImageProxy } from './image.proxy';

class HmacMock {
  private signature: string;

  constructor(algorithm: string, key: Buffer) {
    this.signature = algorithm + '/' + key.toString();
  }

  update(data: Buffer | string): HmacMock {
    this.signature += data.toString();
    return this;
  }

  digest(encoding?: BinaryToTextEncoding): string {
    return this.signature + '/' + encoding;
  }
}

jest.mock('node:crypto', () => {
  return {
    createHmac: jest.fn<HmacMock, [string, Buffer]>(
      (algorithm, key) => new HmacMock(algorithm, key),
    ),
  };
});

describe('ImageProxy', () => {
  let logger: LoggerServiceMock;
  let config: ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();
    logger = new LoggerServiceMock();
    config = new ConfigService({
      IMGPROXY_BASE_URL: 'url/%sign/w:%width/',
      IMGPROXY_PATH_S3: 's3/bucket/path/%id',
      IMGPROXY_KEY: 'key',
      IMGPROXY_SALT: 'salt',
    });
  });

  it('should be null', () => {
    const image = new ImageProxy(config, logger, '');
    expect(image.getImageUrls()).toBeNull();
  });

  it('should get image urls', () => {
    const image = new ImageProxy(config, logger, '1');
    const urls = image.getImageUrls();
    const key = Buffer.from('key', 'hex').toString();
    const salt = Buffer.from('salt', 'hex').toString();
    const path = 'w:%w/s3/bucket/path/1';
    const url = `url/sha256/${key}${salt}/${path}/base64url/${path}`;
    expect(Object.keys(urls)?.length).toBe(8);
    expect(urls.urlJpg).toBe(url.replace(/%w/g, '0'));
    expect(urls.urlJpg100).toBe(url.replace(/%w/g, '100'));
    expect(urls.urlJpg300).toBe(url.replace(/%w/g, '300'));
    expect(urls.urlJpg500).toBe(url.replace(/%w/g, '500'));
    expect(urls.urlJpg750).toBe(url.replace(/%w/g, '750'));
    expect(urls.urlJpg1000).toBe(url.replace(/%w/g, '1000'));
    expect(urls.urlJpg1500).toBe(url.replace(/%w/g, '1500'));
    expect(urls.urlJpg2500).toBe(url.replace(/%w/g, '2500'));
  });

  it('should not be logged', () => {
    new ImageProxy(config, logger, '').getImageUrls();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('should be logged', () => {
    const image = new ImageProxy(config, logger, '1');
    image.getImageUrls();
    image.getImageUrls();
    expect(logger.log).toHaveBeenCalledTimes(2);
  });
});
