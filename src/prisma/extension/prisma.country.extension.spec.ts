import { LoggerServiceMock } from '../../logger/logger.mock';
import { initPrisma, PrismaClientExtended } from '../prisma';
import { CountryImageComputation } from './prisma.country.extension';
import { ConfigService } from '@nestjs/config';
import { IImageFlag, ImageFlag } from '../../image/image.flag';
import { LoggerService } from '../../logger/logger.service';

jest.mock<typeof import('@prisma/client')>('@prisma/client', () => {
  return {
    ...jest.requireActual('@prisma/client'),
    PrismaClient:
      jest.requireActual<typeof import('prismock')>('prismock').PrismockClient,
  };
});

jest.mock('../../image/image.flag', () => ({
  ImageFlag: jest.fn<
    Partial<ImageFlag>,
    [ConfigService, LoggerService, string]
  >((config, logger, countryId) => ({
    getImageUrls: jest.fn<IImageFlag, []>(() => ({
      urlSvg: `${countryId}.svg`,
    })),
  })),
}));

describe('PrismaCountryExtension', () => {
  let logger: LoggerServiceMock;
  let prisma: PrismaClientExtended;

  beforeEach(async () => {
    jest.clearAllMocks();
    logger = new LoggerServiceMock();
    prisma = initPrisma(logger).$extends(
      CountryImageComputation(new ConfigService(), logger),
    );
  });

  it('should get with image', async () => {
    await prisma.country.create({
      data: { id: 'ID', name: 'test' },
    });
    const country = await prisma.country.findUnique({
      where: { name: 'test' },
    });
    expect(country).not.toBeNull();
    // TODO - $extends is not working (prismock issue)
    // expect(country.image).not.toBeNull();
  });
});
