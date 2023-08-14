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

describe('PrismaType', () => {
  let logger: LoggerServiceMock;
  let prisma: PrismaClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    logger = new LoggerServiceMock();
    prisma = initPrisma(logger);
  });

  it('should not find', async () => {
    const type = await prisma.type.findUnique({
      where: { name: '1' },
    });
    expect(type).toBeNull();
  });

  it('should create with defaults', async () => {
    await prisma.type.create({ data: { name: 'test' } });
    const type = await prisma.type.findUnique({ where: { name: 'test' } });
    expect(type).not.toBeNull();
    expect(type.id).toHaveLength(36);
    expect(type.name).toBe('test');
  });

  it('should not create duplicate', async () => {
    // TODO - this is not working (prismock issue)
    // await prisma.type.create({ data: { name: 'test' } });
    // await prisma.type.create({ data: { name: 'test' } });
  });

  it('should get with items', async () => {
    await prisma.type.create({ data: { name: 'type' } });
    await prisma.item.create({
      data: { name: 'item', type: { connect: { name: 'type' } } },
    });
    const type = await prisma.type.findUnique({
      where: { name: 'type' },
      include: { items: true },
    });
    expect(type).not.toBeNull();
    expect(type.items).toHaveLength(1);
    expect(type.items[0].name).toBe('item');
  });

  it('should log', async () => {
    // TODO - $on is not working (prismock issue)
  });
});
