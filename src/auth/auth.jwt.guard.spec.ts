import express from 'express';
import passport from 'passport';
import { Strategy } from 'passport-strategy';
import { Test } from '@nestjs/testing';
import { PassportStrategy } from '@nestjs/passport';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { User } from '@prisma/client';

import { LoggerModuleMock } from '../logger/logger.mock';
import { AuthJwtGuard } from './auth.jwt.guard';

class JwtStrategy implements passport.Strategy {
  authenticate(this: Strategy, req: express.Request) {
    req.user = req.headers as unknown as User;
    return this.success(
      req.user,
      req.headers ? {} : { message: 'Unauthorized' },
    );
  }
}

class AuthJwtStrategyMock extends PassportStrategy(JwtStrategy, 'jwt') {}

describe('AuthJwtGuard', () => {
  let guard: AuthJwtGuard;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      imports: [LoggerModuleMock],
      providers: [AuthJwtGuard, AuthJwtStrategyMock],
    }).compile();
    guard = module.get<AuthJwtGuard>(AuthJwtGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should activate without token', async () => {
    const req = {};
    const success = await guard.canActivate(
      new ExecutionContextHost([req, {}, {}]),
    );
    expect(success).toBe(true);
    expect(req['user']).toBeUndefined();
  });

  it('should activate with token', async () => {
    const req = { headers: { name: 'name' } };
    const success = await guard.canActivate(
      new ExecutionContextHost([req, {}, {}]),
    );
    expect(success).toBe(true);
    expect(req['user']).toEqual(req.headers);
  });

  it('should set logging context', async () => {
    expect(guard['logger'].setContext).toBeCalledWith(AuthJwtGuard.name);
  });

  it('should be logged info', async () => {
    await guard.canActivate(new ExecutionContextHost([{}, {}, {}]));
    expect(guard['logger'].log).toHaveBeenCalledWith(
      'User handled: Unauthorized',
    );
  });

  it('should be logged user', async () => {
    await guard.canActivate(
      new ExecutionContextHost([{ headers: { name: '1' } }, {}, {}]),
    );
    expect(guard['logger'].log).not.toHaveBeenCalledWith(
      'User handled: Unauthorized',
    );
    expect(guard['logger'].log).toHaveBeenCalledTimes(1);
  });
});
