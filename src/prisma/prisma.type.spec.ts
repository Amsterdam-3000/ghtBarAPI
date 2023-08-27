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
    // TODO - @unique is not working (prismock issue)
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
    expect(type.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'item' })]),
    );
  });

  it('should delete from item', async () => {
    await prisma.type.create({ data: { name: 'type' } });
    await prisma.item.create({
      data: { name: 'item', type: { connect: { name: 'type' } } },
    });
    await prisma.type.delete({ where: { name: 'type' } });
    const item = await prisma.item.findUnique({
      where: { name: 'item' },
      include: { type: true },
    });
    expect(item).not.toBeNull();
    expect(item.type).toBeNull();
    // TODO - relation deletion is not working (prismock issue)
    // expect(item.typeId).toBeNull();
  });

  it('should log', async () => {
    // TODO - $on is not working (prismock issue)
  });
});
