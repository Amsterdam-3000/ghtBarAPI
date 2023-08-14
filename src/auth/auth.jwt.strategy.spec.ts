import * as passport from 'passport';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { LoggerModuleMock } from '../logger/logger.mock';
import { AuthJwtStrategy } from './auth.jwt.strategy';

jest.mock(
  'jsonwebtoken',
  jest.fn(() => ({
    verify: jest.fn<void, [string, string, object, (err?, payload?) => void]>(
      (token, secret, options, callback) => {
        if (token !== secret) return callback(new Error('Invalid token'));
        return callback(null, { name: token, options: options });
      },
    ),
  })),
);

describe('AuthJwtStrategy', () => {
  let strategy: AuthJwtStrategy;

  beforeAll(() => {
    process.env.JWT_SECRET = 'secret';
    jest.spyOn(AuthJwtStrategy.prototype, 'validate');
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      imports: [
        LoggerModuleMock,
        ConfigModule.forRoot({ ignoreEnvFile: true }),
      ],
      providers: [AuthJwtStrategy],
    }).compile();
    strategy = module.get<AuthJwtStrategy>(AuthJwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should pass info without authorization', async () => {
    passport.authenticate('jwt', (err, payload, info) => {
      expect(strategy.validate).not.toBeCalled();
      expect(err).toBeFalsy();
      expect(payload).toBeFalsy();
      expect(info).toEqual(
        expect.objectContaining({ message: 'No auth token' }),
      );
    })({ headers: {} } as any);
  });

  it('should pass info with wrong authorization', async () => {
    passport.authenticate('jwt', (err, payload, info) => {
      expect(strategy.validate).not.toBeCalled();
      expect(err).toBeFalsy();
      expect(payload).toBeFalsy();
      expect(info).toEqual(
        expect.objectContaining({ message: 'No auth token' }),
      );
    })({ headers: { authorization: 'bearer1' } } as any);
  });

  it('should pass info with wrong token', async () => {
    passport.authenticate('jwt', (err, payload, info) => {
      expect(strategy.validate).not.toBeCalled();
      expect(err).toBeFalsy();
      expect(payload).toBeFalsy();
      expect(info).toEqual(
        expect.objectContaining({ message: 'Invalid token' }),
      );
    })({ headers: { authorization: 'bearer 1' } } as any);
  });

  it('should pass payload with right token', async () => {
    passport.authenticate('jwt', (err, payload, info) => {
      expect(strategy.validate).toBeCalled();
      expect(err).toBeFalsy();
      expect(payload).toEqual(
        expect.objectContaining({
          name: 'secret',
          options: expect.objectContaining({ ignoreExpiration: false }),
        }),
      );
      expect(info).toBeFalsy();
    })({ headers: { authorization: 'bearer secret' } } as any);
  });

  it('should be logged validate', async () => {
    passport.authenticate('jwt', () => {
      expect(strategy['logger'].log).toBeCalled();
    })({
      headers: { authorization: 'bearer secret' },
    } as any);
  });

  it('should set logging context', async () => {
    expect(strategy['logger'].setContext).toBeCalledWith(AuthJwtStrategy.name);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
