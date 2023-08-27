import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async login(req: Request): Promise<{ token: string }> {
    this.logger
      .setReq(req)
      .log(`User logged: ${LoggerService.userToStr(req.user)}`);

    delete req.user.password;
    const token = this.jwtService.sign(req.user);
    return { token: token };
  }
}
