import { ConsoleLogger } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { LoggerService } from './logger.service';
import { LoggerModule } from './logger.module';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeAll(async () => {
    jest.spyOn(ConsoleLogger.prototype, 'log').mockImplementation();
    jest.spyOn(ConsoleLogger.prototype, 'error').mockImplementation();
    jest.spyOn(ConsoleLogger.prototype, 'warn').mockImplementation();
    jest.spyOn(ConsoleLogger.prototype, 'verbose').mockImplementation();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
    }).compile();
    service = await module.resolve<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get user string', () => {
    const userStr = LoggerService.userToStr({
      name: 'name',
      role: 'role',
      email: 'email',
    } as any);
    expect(userStr).toBe('{"name":"name","role":"role"}');
  });
  it('should get unique user string', () => {
    const userStr = LoggerService.userUniqToStr({
      id: 'id',
      name: 'name',
      role: 'role',
      email: 'email',
    } as any);
    expect(userStr).toBe('{"id":"id","name":"name","email":"email"}');
  });

  it('should get graphql info string without arguments', () => {
    const userStr = LoggerService.gqlToStr({
      info: {
        path: {
          typename: 'typename',
          key: 'key',
        },
      },
      args: {},
    } as any);
    expect(userStr).toBe('GraphQL typename "key"');
  });
  it('should get graphql info string with arguments', () => {
    const userStr = LoggerService.gqlToStr({
      info: {
        path: {
          typename: 'typename',
          key: 'key',
        },
      },
      args: {
        arg1: 'arg1',
        arg2: 'arg2',
      },
    } as any);
    expect(userStr).toBe(
      'GraphQL typename "key" {"arg1":"arg1","arg2":"arg2"}',
    );
  });

  it('should log without context', () => {
    service.log('test');
    expect(ConsoleLogger.prototype.log).toBeCalledWith('test');
  });
  it('should log with context', () => {
    service.log('test', 'context');
    expect(ConsoleLogger.prototype.log).toBeCalledWith('test', 'context');
  });

  it('should info without context', () => {
    service.info('test');
    expect(ConsoleLogger.prototype.log).toBeCalledWith('test');
  });
  it('should info with context', () => {
    service.info('test', 'context');
    expect(ConsoleLogger.prototype.log).toBeCalledWith('test', 'context');
  });

  it('should error without context', () => {
    service.error('test');
    expect(ConsoleLogger.prototype.error).toBeCalledWith('test');
  });
  it('should error with context', () => {
    service.error('test', 'context');
    expect(ConsoleLogger.prototype.error).toBeCalledWith('test', 'context');
  });

  it('should warn without context', () => {
    service.warn('test');
    expect(ConsoleLogger.prototype.warn).toBeCalledWith('test');
  });
  it('should warn with context', () => {
    service.warn('test', 'context');
    expect(ConsoleLogger.prototype.warn).toBeCalledWith('test', 'context');
  });

  it('should not verbose request', () => {
    service.log('test');
    service.info('test');
    service.warn('test');
    service.error('test');
    expect(ConsoleLogger.prototype.verbose).not.toBeCalled();
  });
  it('should verbose request from original ip', () => {
    service.setReq({
      ip: 'ip',
      ips: [],
      method: 'METHOD',
      originalUrl: 'url',
      httpVersion: '1.1',
    } as any);
    service.log('');
    service.info('');
    service.warn('');
    service.error('');
    expect(ConsoleLogger.prototype.verbose).toBeCalledTimes(4);
    expect(ConsoleLogger.prototype.verbose).toBeCalledWith(
      'HTTP Request "METHOD url HTTP/1.1" from [ip]',
    );
  });
  it('should verbose request from proxy ip and with context', () => {
    service.setReq({
      ip: 'ip1',
      ips: ['ip2', 'ip3'],
      method: 'METHOD',
      originalUrl: 'url',
      httpVersion: '1.1',
    } as any);
    service.log('', 'context');
    expect(ConsoleLogger.prototype.verbose).toBeCalledWith(
      'HTTP Request "METHOD url HTTP/1.1" from [ip2]',
      'context',
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
