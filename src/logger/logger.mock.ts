import { Injectable, Module, Scope } from '@nestjs/common';

import { LoggerService } from './logger.service';

jest.spyOn(LoggerService, 'userToStr').mockImplementation();
jest.spyOn(LoggerService, 'userUniqToStr').mockImplementation();
jest.spyOn(LoggerService, 'gqlToStr').mockImplementation();

@Injectable({ scope: Scope.DEFAULT })
export class LoggerServiceMock extends LoggerService {
  log = jest.fn();
  error = jest.fn();
  info = jest.fn();
  setContext = jest.fn();
  setReq = jest.fn(() => this);
}

@Module({
  providers: [{ provide: LoggerService, useClass: LoggerServiceMock }],
  exports: [{ provide: LoggerService, useClass: LoggerServiceMock }],
})
export class LoggerModuleMock {}
