import { ConfigService } from '@nestjs/config';

import { LoggerServiceMock } from '../logger/logger.mock';
import { ImageFlag } from './image.flag';

describe('ImageFlag', () => {
  let logger: LoggerServiceMock;
  let config: ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();
    logger = new LoggerServiceMock();
    config = new ConfigService({ FLAG_CDN_URL: 'url/w%width/%id.%ext' });
  });

  it('should be null', () => {
    const image = new ImageFlag(config, logger, '');
    expect(image.getImageUrls()).toBeNull();
  });

  it('should get image urls', () => {
    const image = new ImageFlag(config, logger, 'ES');
    const urls = image.getImageUrls();
    expect(Object.keys(urls)?.length).toBe(8);
    expect(urls.urlSvg).toBe('url/es.svg');
    expect(urls.urlPng40).toBe('url/w40/es.png');
    expect(urls.urlPng80).toBe('url/w80/es.png');
    expect(urls.urlPng160).toBe('url/w160/es.png');
    expect(urls.urlPng320).toBe('url/w320/es.png');
    expect(urls.urlPng640).toBe('url/w640/es.png');
    expect(urls.urlPng1280).toBe('url/w1280/es.png');
    expect(urls.urlPng2560).toBe('url/w2560/es.png');
  });

  it('should not be logged', () => {
    new ImageFlag(config, logger, '').getImageUrls();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('should be logged', () => {
    const image = new ImageFlag(config, logger, '11');
    image.getImageUrls();
    image.getImageUrls();
    expect(logger.log).toHaveBeenCalledTimes(2);
  });
});
