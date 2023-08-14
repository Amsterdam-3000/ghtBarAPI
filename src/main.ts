import { NextFunction, Request, Response } from 'express';
import * as useragent from 'express-useragent';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app/app.module';
import { LoggerService } from './logger/logger.service';
import { extendPrisma, initPrisma } from './prisma/prisma';
import { MinioClient } from './minio/minio.client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new LoggerService('Main');

  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN'),
  });

  app.use(useragent.express());
  app.use(
    //TODO Install new 16th version (Nest doesn't support ES modules yet)
    graphqlUploadExpress({
      maxFileSize: config.get<number>('IMAGE_UPLOAD_MAX_SIZE'),
      maxFiles: config.get<number>('IMAGE_UPLOAD_MAX_FILES'),
    }),
  );
  //TODO Change to PrismaService (TypeGraphQL Prisma assign prisma to req)
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const logger = new LoggerService('Prisma').setReq(req);
    const minio = new MinioClient(config, logger);
    const prisma = initPrisma(logger);
    req.prisma = extendPrisma(prisma, minio, config, logger);
    await next();
  });

  await app.listen(config.get<number>('PORT'));
  logger.log(`Apollo Server is available on: ${await app.getUrl()}/graphql`);
}

bootstrap().catch((err) => {
  throw err;
});
