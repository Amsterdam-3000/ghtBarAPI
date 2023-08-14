import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import {
  Controller,
  Get,
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';

import { ThrottlerGuard } from './throttler.guard';
import { ThrottlerMiddleware } from './throttler.middleware';
import { ThrottlerGuardMock } from './throttler.guard.mock';

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
  providers: [{ provide: ThrottlerGuard, useClass: ThrottlerGuardMock }],
})
class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ThrottlerMiddleware).forRoutes('test1');
  }
}

describe('ThrottlerMiddleware', () => {
  let app: INestApplication;
  let guard: ThrottlerGuardMock;

  beforeAll(async () => {
    jest.spyOn(ThrottlerMiddleware.prototype, 'use');
    const module = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();
    guard = module.get<ThrottlerGuardMock>(ThrottlerGuard);
    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    guard.init();
  });

  it('should not call throttler middleware', () => {
    return request(app.getHttpServer())
      .get('/test2')
      .expect(200)
      .expect('test2')
      .then(() => {
        expect(ThrottlerMiddleware.prototype.use).not.toHaveBeenCalled();
      });
  });

  it('should not throw error for one request from one ip', () => {
    return request(app.getHttpServer())
      .get('/test1')
      .query({ ip: '1' })
      .expect(200)
      .expect('test1')
      .then(() => {
        expect(ThrottlerMiddleware.prototype.use).toHaveBeenCalledTimes(1);
      });
  });

  it('should throw error for two requests from the same ip', () => {
    return request(app.getHttpServer())
      .get('/test1')
      .query({ ip: '1' })
      .expect(200)
      .then(() => {
        expect(ThrottlerMiddleware.prototype.use).toHaveBeenCalledTimes(1);
        return request(app.getHttpServer())
          .get('/test1')
          .query({ ip: '1' })
          .expect(429)
          .then(() => {
            expect(ThrottlerMiddleware.prototype.use).toHaveBeenCalledTimes(2);
          });
      });
  });

  it('should not throw error for two requests from different ips', () => {
    return request(app.getHttpServer())
      .get('/test1')
      .query({ ip: '1' })
      .expect(200)
      .then(() => {
        expect(ThrottlerMiddleware.prototype.use).toHaveBeenCalledTimes(1);
        return request(app.getHttpServer())
          .get('/test1')
          .query({ ip: '2' })
          .expect(200)
          .then(() => {
            expect(ThrottlerMiddleware.prototype.use).toHaveBeenCalledTimes(2);
          });
      });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
