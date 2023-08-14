import * as passport from 'passport';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';

import { LoggerModuleMock } from '../logger/logger.mock';
import { PrismaClientExtended } from '../prisma/prisma';
import { AuthLocalStrategy } from './auth.local.strategy';

describe('AuthLocalStrategy', () => {
  let strategy: AuthLocalStrategy;
  let prisma: DeepMockProxy<PrismaClientExtended>;

  beforeAll(() => {
    jest.spyOn(AuthLocalStrategy.prototype, 'validate');
    prisma = mockDeep<PrismaClientExtended>();
    prisma.user.signIn.mockImplementation(async (user, pass) => {
      if (user === 'user' && pass === 'pass') {
        return { id: 1, name: 'user', pass: 'pass' } as any;
      } else {
        throw new Error();
      }
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      imports: [LoggerModuleMock],
      providers: [AuthLocalStrategy],
    }).compile();
    strategy = module.get<AuthLocalStrategy>(AuthLocalStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should pass info without credentials', async () => {
    passport.authenticate('local', (err, payload, info) => {
      expect(strategy.validate).not.toBeCalled();
      expect(err).toBeFalsy();
      expect(payload).toBeFalsy();
      expect(info?.message).toBe('Missing credentials');
    })({ prisma: prisma } as any);
  });

  it('should pass info with incomplete credentials', async () => {
    passport.authenticate('local', (err, payload, info) => {
      expect(strategy.validate).not.toBeCalled();
      expect(err).toBeFalsy();
      expect(payload).toBeFalsy();
      expect(info?.message).toBe('Missing credentials');
    })({ prisma: prisma, body: { username: '1' } } as any);
  });

  it('should pass error with invalid credentials', async () => {
    passport.authenticate('local', (err, payload, info) => {
      expect(strategy.validate).toBeCalled();
      expect(err?.message).toBe('Unauthorized');
      expect(err?.status).toBe(401);
      expect(payload).toBeUndefined();
      expect(info).toBeUndefined();
    })({
      prisma: prisma,
      body: { username: 'user', password: 'invalid' },
    } as any);
  });

  it('should pass payload with right credentials', async () => {
    passport.authenticate('local', (err, payload, info) => {
      expect(strategy.validate).toBeCalled();
      expect(err).toBeFalsy();
      expect(payload).toMatchObject({ id: 1, name: 'user', pass: 'pass' });
      expect(info).toBeUndefined();
    })({
      prisma: prisma,
      body: { username: 'user', password: 'pass' },
    } as any);
  });

  it('should be errored validate', async () => {
    passport.authenticate('local', () => {
      expect(strategy['logger'].error).toBeCalled();
    })({
      prisma: prisma,
      body: { username: 'user', password: 'invalid' },
    } as any);
  });

  it('should be logged validate', async () => {
    passport.authenticate('local', () => {
      expect(strategy['logger'].log).toBeCalled();
    })({
      prisma: prisma,
      body: { username: 'user', password: 'pass' },
    } as any);
  });

  it('should set logging context', async () => {
    expect(strategy['logger'].setContext).toBeCalledWith(
      AuthLocalStrategy.name,
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
