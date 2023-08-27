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

describe('PrismaUser', () => {
  let logger: LoggerServiceMock;
  let prisma: PrismaClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    logger = new LoggerServiceMock();
    prisma = initPrisma(logger);
  });

  it('should not find', async () => {
    const user = await prisma.user.findUnique({
      where: { name: '1' },
    });
    expect(user).toBeNull();
  });

  it('should create with defaults', async () => {
    await prisma.user.create({
      data: { name: '1', email: '1', password: '1' },
    });
    const user = await prisma.user.findUnique({
      where: { name: '1' },
    });
    expect(user).not.toBeNull();
    expect(user.id).toHaveLength(36);
    expect(user.name).toBe('1');
    expect(user.email).toBe('1');
    expect(user.password).toBe('1');
    expect(user.role).toBe('USER');
    expect(user.updatedAt).toBeNull();
    expect(user.createdAt).not.toBeNull();
  });

  it('should create with values', async () => {
    await prisma.user.create({
      data: { name: '1', email: '1', password: '1', role: 'ADMIN' },
    });
    const user = await prisma.user.findUnique({
      where: { name: '1' },
    });
    expect(user).not.toBeNull();
    expect(user.role).toBe('ADMIN');
  });

  it('should not create duplicate', async () => {
    // TODO - @unique is not working (prismock issue)
    // await prisma.user.createMany({
    //   data: [
    //     { name: '1', email: '1', password: '1' },
    //     { name: '1', email: '1', password: '1' },
    //   ],
    // });
  });

  it('should update values', async () => {
    const userOld = await prisma.user.create({
      data: { name: '1', email: '1', password: '1' },
    });
    const userNew = await prisma.user.update({
      where: { name: '1' },
      data: { name: '2' },
    });
    expect(userOld).not.toBeNull();
    expect(userNew).not.toBeNull();
    expect(userNew.id).toBe(userOld.id);
    expect(userNew.name).not.toBe(userOld.name);
    expect(userNew.createdAt).toBe(userOld.createdAt);
    // TODO - @updateAt is not working (prismock issue)
    // expect(userNew.updatedAt).not.toBeNull();
  });

  it('should get with items', async () => {
    await prisma.user.create({
      data: { name: '1', email: '1', password: '1' },
    });
    await prisma.item.create({
      data: { name: 'item', user: { connect: { name: '1' } } },
    });
    const user = await prisma.user.findUnique({
      where: { name: '1' },
      include: { items: true },
    });
    expect(user).not.toBeNull();
    expect(user.items).toHaveLength(1);
    expect(user.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'item' })]),
    );
  });

  it('should delete from item', async () => {
    await prisma.user.create({
      data: { name: '1', email: '1', password: '1' },
    });
    await prisma.item.create({
      data: { name: 'item', user: { connect: { name: '1' } } },
    });
    await prisma.user.delete({ where: { name: '1' } });
    const item = await prisma.item.findUnique({
      where: { name: 'item' },
      include: { user: true },
    });
    expect(item).not.toBeNull();
    expect(item.user).toBeNull();
    // TODO - relation deletion is not working (prismock issue)
    // expect(item.userId).toBeNull();
  });

  it('should log', async () => {
    // TODO - $on is not working (prismock issue)
  });
});
