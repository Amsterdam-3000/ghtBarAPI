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

import { LoggerModuleMock, LoggerServiceMock } from './logger.mock';
import { LoggerMiddleware } from './logger.middleware';
import { LoggerService } from './logger.service';

@Controller()
class TestController {
  @Get('test')
  test() {
    return 'test';
  }
}

@Module({
  imports: [LoggerModuleMock],
  controllers: [TestController],
})
class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('/*');
  }
}

describe('LoggerMiddleware', () => {
  let app: INestApplication;
  let logger: LoggerServiceMock;
  let controller: TestController;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();
    controller = module.get<TestController>(TestController);
    logger = module.get<LoggerServiceMock>(LoggerService);
    jest.spyOn(controller, 'test');
    app = module.createNestApplication();
    await app.init();
  });

  it('should set logging context', async () => {
    expect(logger.setContext).toBeCalledWith(LoggerMiddleware.name);
  });

  it('should log request at the beginning and at the end', () => {
    jest.clearAllMocks();
    return request(app.getHttpServer())
      .get('/test')
      .expect(200)
      .expect('test')
      .then(() => {
        expect(logger.log).toHaveBeenCalledTimes(2);
        expect(logger.log).toHaveBeenNthCalledWith(
          1,
          expect.stringContaining('HTTP Request'),
        );
        expect(logger.log).toHaveBeenNthCalledWith(
          2,
          expect.stringContaining('HTTP Response'),
        );
        expect(controller.test).toHaveBeenCalledAfter(logger.log);
      });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
