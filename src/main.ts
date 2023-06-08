import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

import { AppModule } from './app/app.module';
import { prisma } from './prisma/prisma.service';
import { jwtStrategy } from './auth/jwt.strategy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  app.use(
    //TODO Install new 16th version (Nest doesn't support ES modules yet)
    graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 20 }),
  );

  //TODO Change to PrismaServisce (TypeGraphQL Prisma assign prisma to req)
  app.use(async (req, res, next) => {
    req.prisma = prisma;
    await next();
  });

  //TODO Change to AuthGuard('jwt') (TypeGraphQL doesn't support guards)
  app.use('/graphql', (req, res, next) =>
    jwtStrategy.authenticate(async (user) => {
      req.user = user;
      await next();
    })(req, res, next),
  );

  await app.listen(configService.get('PORT'));
  console.log(
    `Application is running and Apollo sandbox is available on: ${await app.getUrl()}/graphql`,
  );
}

bootstrap().catch((err) => {
  throw err;
});
