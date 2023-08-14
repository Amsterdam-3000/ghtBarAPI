import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '../logger/logger.service';
import { MinioClient } from '../minio/minio.client';
import {
  ImageDeleting,
  ImageUploading,
  ImageValidation,
} from './extension/prisma.image.extension';
import { UserAuthentication } from './extension/prisma.user.extension';
import { ItemImageComputation } from './extension/prisma.item.extension';
import { CountryImageComputation } from './extension/prisma.country.extension';

export const initPrisma = (logger: LoggerService) => {
  const prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
  });

  prisma.$on('query', (e) => {
    const queryString = `Query: "${e.query}"`;
    if (e.params !== '[]') {
      logger.log(`${queryString} ${e.params} ${e.duration}ms`);
    } else {
      logger.log(`${queryString} ${e.duration}ms`);
    }
  });
  prisma.$on('warn', (e) => {
    logger.warn(`Warn: "${e.message}"`);
  });
  prisma.$on('error', (e) => {
    logger.error(`Error: "${e.message}"`);
  });

  return prisma;
};

export const extendPrisma = (
  prisma: PrismaClient,
  minio: MinioClient,
  config: ConfigService,
  logger: LoggerService,
) => {
  return prisma
    .$extends(ImageValidation())
    .$extends(ImageUploading(minio, logger))
    .$extends(ImageDeleting(minio, logger))
    .$extends(UserAuthentication(logger))
    .$extends(ItemImageComputation(config, logger))
    .$extends(CountryImageComputation(config, logger));
};

export type PrismaClientExtended = ReturnType<typeof extendPrisma>;
