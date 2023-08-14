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

describe('Item', () => {
  let logger: LoggerServiceMock;
  let prisma: PrismaClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    logger = new LoggerServiceMock();
    prisma = initPrisma(logger);
  });

  it('should not find', async () => {
    const item = await prisma.item.findUnique({
      where: { name: '1' },
    });
    expect(item).toBeNull();
  });

  it('should create with defaults', async () => {
    await prisma.item.create({ data: { name: '1' } });
    const item = await prisma.item.findUnique({
      where: { name: '1' },
    });
    expect(item).not.toBeNull();
    expect(item.id).toHaveLength(36);
    expect(item.name).toBe('1');
    expect(item.strength).toBe(0);
    expect(item.typeId).toBe('0');
    expect(item.countryId).toBe('UN');
    expect(item.userId).toBe('0');
    expect(item.updatedAt).toBeNull();
    expect(item.createdAt).not.toBeNull();
  });

  it('should create with values', async () => {
    await prisma.item.create({
      data: {
        name: '1',
        strength: 1,
        userId: '1',
        typeId: '1',
        countryId: '1',
      },
    });
    const item = await prisma.item.findUnique({
      where: { name: '1' },
    });
    expect(item).not.toBeNull();
    expect(item.strength).toBe(1);
    expect(item.typeId).toBe('1');
    expect(item.countryId).toBe('1');
    expect(item.userId).toBe('1');
  });

  it('should not create duplicate', async () => {
    // TODO - this is not working (prismock issue)
    // await prisma.item.createMany({
    //   data: [ { name: '1' }, { name: '1' } ],
    // });
  });

  it('should update values', async () => {
    const itemOld = await prisma.item.create({
      data: { name: '1' },
    });
    const itemNew = await prisma.item.update({
      where: { name: '1' },
      data: { name: '2' },
    });
    expect(itemOld).not.toBeNull();
    expect(itemNew).not.toBeNull();
    expect(itemNew.id).toBe(itemOld.id);
    expect(itemNew.name).not.toBe(itemOld.name);
    expect(itemNew.createdAt).toBe(itemOld.createdAt);
    // TODO - this is not working (prismock issue)
    // expect(itemNew.updatedAt).not.toBeNull();
  });

  it('should get with type', async () => {
    await prisma.type.create({
      data: { name: 'type' },
    });
    await prisma.item.create({
      data: { name: '1', type: { connect: { name: 'type' } } },
    });
    const item = await prisma.item.findUnique({
      where: { name: '1' },
      include: { type: true },
    });
    expect(item).not.toBeNull();
    expect(item.type).not.toBeNull();
    expect(item.type.name).toBe('type');
  });

  it('should get with country', async () => {
    await prisma.country.create({
      data: { id: '1', name: 'country' },
    });
    await prisma.item.create({
      data: { name: '1', country: { connect: { name: 'country' } } },
    });
    const item = await prisma.item.findUnique({
      where: { name: '1' },
      include: { country: true },
    });
    expect(item).not.toBeNull();
    expect(item.country).not.toBeNull();
    expect(item.country.name).toBe('country');
  });

  it('should get with user', async () => {
    await prisma.user.create({
      data: { name: 'user', email: '1', password: '1' },
    });
    await prisma.item.create({
      data: { name: '1', user: { connect: { name: 'user' } } },
    });
    const item = await prisma.item.findUnique({
      where: { name: '1' },
      include: { user: true },
    });
    expect(item).not.toBeNull();
    expect(item.user).not.toBeNull();
    expect(item.user.name).toBe('user');
  });

  it('should log', async () => {
    // TODO - $on is not working (prismock issue)
  });
});
