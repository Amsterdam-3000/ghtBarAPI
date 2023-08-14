import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

import { LoggerServiceMock } from '../logger/logger.mock';
import { LoggerService } from '../logger/logger.service';
import { ThrottlerGuard } from './throttler.guard';
import { ThrottlerModule } from './throttler.module';

class ResponseMock {
  headers;

  constructor() {
    this.headers = {};
  }

  header(name: string, value: string) {
    this.headers[name] = value;
    return this;
  }
}

describe('ThrottlerGuard', () => {
  let guard: ThrottlerGuard;

  beforeAll(() => {
    process.env.THROTTLER_TTL = '2';
    process.env.THROTTLER_LIMIT = '1';
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        ThrottlerModule,
      ],
    })
      .overrideProvider(LoggerService)
      .useClass(LoggerServiceMock)
      .compile();
    guard = module.get<ThrottlerGuard>(ThrottlerGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should activate for one request from one static ip', async () => {
    const res = new ResponseMock();
    const success = await guard.canActivate(
      new ExecutionContextHost(
        [{ ips: [], ip: '1' }, res, {}],
        ThrottlerGuard,
        guard.canActivate,
      ),
    );
    expect(success).toBe(true);
    expect(res.headers['X-RateLimit-Limit']).toBe('1');
    expect(res.headers['X-RateLimit-Remaining']).toBe(0);
    expect(res.headers['X-RateLimit-Reset']).toBeGreaterThan(0);
  });

  it('should activate for one request from one proxy ip', async () => {
    const res = new ResponseMock();
    const success = await guard.canActivate(
      new ExecutionContextHost(
        [{ ips: [1] }, res, {}],
        ThrottlerGuard,
        guard.canActivate,
      ),
    );
    expect(success).toBe(true);
    expect(res.headers['X-RateLimit-Limit']).toBe('1');
    expect(res.headers['X-RateLimit-Remaining']).toBe(0);
    expect(res.headers['X-RateLimit-Reset']).toBeGreaterThan(0);
  });

  it('should activate for two requests from different ips', async () => {
    let res = new ResponseMock();
    let success = await guard.canActivate(
      new ExecutionContextHost(
        [{ ips: [1] }, res, {}],
        ThrottlerGuard,
        guard.canActivate,
      ),
    );
    expect(success).toBe(true);
    res = new ResponseMock();
    success = await guard.canActivate(
      new ExecutionContextHost(
        [{ ips: [], ip: 2 }, res, {}],
        ThrottlerGuard,
        guard.canActivate,
      ),
    );
    expect(success).toBe(true);
  });

  it('should not activate for two requests from one ip', async () => {
    let res = new ResponseMock();
    const success = await guard.canActivate(
      new ExecutionContextHost(
        [{ ips: [1] }, res, {}],
        ThrottlerGuard,
        guard.canActivate,
      ),
    );
    expect(success).toBe(true);
    res = new ResponseMock();
    try {
      await guard.canActivate(
        new ExecutionContextHost(
          [{ ips: [], ip: 1 }, res, {}],
          ThrottlerGuard,
          guard.canActivate,
        ),
      );
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err.message).toBe('ThrottlerException: Too Many Requests');
      expect(res.headers['Retry-After']).toBeGreaterThan(0);
    }
  });

  it('should set logging context', async () => {
    expect(guard['logger'].setContext).toBeCalledWith(ThrottlerGuard.name);
  });

  it('should be logged info', async () => {
    const res = new ResponseMock();
    await guard.canActivate(
      new ExecutionContextHost(
        [{ ips: [1] }, res, {}],
        ThrottlerGuard,
        guard.canActivate,
      ),
    );
    expect(guard['logger'].log).toHaveBeenCalled();
  });

  afterEach(() => {
    guard = null;
  });
});
