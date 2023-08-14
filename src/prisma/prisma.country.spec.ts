import { PrismaClient } from '@prisma/client';

import { LoggerServiceMock } from '../logger/logger.mock';
import { initPrisma } from './prisma';

jest.mock<typeof import('@prisma/client')>('@prisma/client', () => {
  return {
    ...jest.requireActual('@prisma/client'),
    PrismaClient:
      jest.requireActual<typeof import('prismock')>('prismock').PrismockClient,
  };
});

describe('PrismaCountry', () => {
  let logger: LoggerServiceMock;
  let prisma: PrismaClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    logger = new LoggerServiceMock();
    prisma = initPrisma(logger);
  });

  it('should not find', async () => {
    const country = await prisma.country.findUnique({
      where: { name: '1' },
    });
    expect(country).toBeNull();
  });

  it('should create with values', async () => {
    await prisma.country.create({
      data: { id: 'ID', name: 'test', emoji: 'emoji' },
    });
    const country = await prisma.country.findUnique({
      where: { name: 'test' },
    });
    expect(country).not.toBeNull();
    expect(country.id).toBe('ID');
    expect(country.name).toBe('test');
    expect(country.emoji).toBe('emoji');
  });

  it('should not create duplicate', async () => {
    // TODO - this is not working (prismock issue)
    // await prisma.country.create({ data: { id: 'ID', name: 'test1' } });
    // await prisma.country.create({ data: { id: 'ID', name: 'test2' } });
  });

  it('should get with items', async () => {
    await prisma.country.create({ data: { id: '1', name: 'country' } });
    await prisma.item.create({
      data: { name: 'item', country: { connect: { id: '1' } } },
    });
    const country = await prisma.country.findUnique({
      where: { id: '1' },
      include: { items: true },
    });
    expect(country).not.toBeNull();
    expect(country.items).toHaveLength(1);
    expect(country.items[0].name).toBe('item');
  });

  it('should log', async () => {
    // TODO - $on is not working (prismock issue)
  });
});
