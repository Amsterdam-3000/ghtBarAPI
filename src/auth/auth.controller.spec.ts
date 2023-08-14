import * as request from 'supertest';
import { Request } from 'express';
import { Test } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { AuthGuard, IAuthGuard } from '@nestjs/passport';

import { LoggerModuleMock } from '../logger/logger.mock';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

class AuthServiceMock implements Partial<AuthService> {
  async login(req: Request) {
    if (req.user?.name !== 'user' || req.user?.password !== 'pass')
      throw new UnauthorizedException();
    return { token: JSON.stringify(req.user) };
  }
}

class AuthGuardMock implements Partial<IAuthGuard> {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.body.name || !req.body.password) return false;
    req.user = req.body;
    return true;
  }
}

describe('AuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModuleMock],
      controllers: [AuthController],
      providers: [AuthService],
    })
      .overrideProvider(AuthService)
      .useClass(AuthServiceMock)
      .overrideGuard(AuthGuard('local'))
      .useClass(AuthGuardMock)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('should return 403 without user in a body', () => {
    return request(app.getHttpServer()).post('/auth/login').expect(403);
  });

  it('should return 401 with wrong credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: 'user', password: 'wrong' })
      .expect(401);
  });

  it('should return token with right credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: 'user', password: 'pass' })
      .expect(201)
      .expect({ token: '{"name":"user","password":"pass"}' });
  });

  afterAll(async () => {
    await app.close();
  });
});
