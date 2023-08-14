import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModuleOptions, JwtService } from '@nestjs/jwt';

import { LoggerService } from '../logger/logger.service';
import { LoggerServiceMock } from '../logger/logger.mock';
import { AuthService } from './auth.service';
import { AuthModule } from './auth.module';

class JwtServiceMock extends JwtService {
  constructor(private jwtOptions?: JwtModuleOptions) {
    super(jwtOptions);
  }

  sign(payload): string {
    return `${this.jwtOptions.secret}/${
      this.jwtOptions.signOptions.expiresIn
    }/${JSON.stringify(payload)}`;
  }
}

describe('AuthService', () => {
  let service: AuthService;

  beforeAll(() => {
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_EXPIRES_IN = '2';
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        AuthModule,
      ],
    })
      .overrideProvider(LoggerService)
      .useClass(LoggerServiceMock)
      .overrideProvider(JwtService)
      .useClass(JwtServiceMock)
      .compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a token', async () => {
    const result = await service.login({
      user: { id: '1', name: 'name', password: 'password' },
    } as any);
    expect(result).toHaveProperty('token');
    expect(result.token).toBe('secret/2/{"id":"1","name":"name"}');
  });

  it('should set logging context', async () => {
    expect(service['logger'].setContext).toBeCalledWith(AuthService.name);
  });

  it('should be logged', async () => {
    await service.login({ user: {} } as any);
    expect(service['logger'].log).toHaveBeenCalledTimes(1);
  });
});
