import * as request from 'supertest';
import { Request } from 'express';
import { Test } from '@nestjs/testing';
import {
  Controller,
  Get,
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  UnauthorizedException,
} from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';

import { AuthJwtGuard } from './auth.jwt.guard';
import { AuthMiddleware } from './auth.middleware';

class AuthJwtGuardMock implements Partial<AuthJwtGuard> {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.query?.token !== 'token') throw new UnauthorizedException();
    return true;
  }
}

@Controller()
class TestController {
  @Get('test1')
  test1() {
    return 'test1';
  }

  @Get('test2')
  test2() {
    return 'test2';
  }
}

@Module({
  controllers: [TestController],
  providers: [{ provide: AuthJwtGuard, useClass: AuthJwtGuardMock }],
})
class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('test1');
  }
}

describe('AuthMiddleware', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.spyOn(AuthMiddleware.prototype, 'use');
    const module = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should not call auth middleware', () => {
    return request(app.getHttpServer())
      .get('/test2')
      .expect(200)
      .expect('test2')
      .then(() => {
        expect(AuthMiddleware.prototype.use).not.toHaveBeenCalled();
      });
  });

  it('should not throw error with right token', () => {
    return request(app.getHttpServer())
      .get('/test1')
      .query({ token: 'token' })
      .expect(200)
      .expect('test1')
      .then(() => {
        expect(AuthMiddleware.prototype.use).toHaveBeenCalledTimes(1);
      });
  });

  it('should throw error with wrong token', () => {
    return request(app.getHttpServer())
      .get('/test1')
      .query({ token: 'wrong' })
      .expect(401)
      .then(() => {
        expect(AuthMiddleware.prototype.use).toHaveBeenCalledTimes(1);
      });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
