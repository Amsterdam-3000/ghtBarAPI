import { Request } from 'express';
import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy, Type } from '@nestjs/passport';
import { User } from '@prisma/client';

import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AuthLocalStrategy extends PassportStrategy<Type<Strategy>>(
  Strategy,
  'local',
) {
  constructor(private logger: LoggerService) {
    //Prisma instance added to context
    super({ passReqToCallback: true });
    this.logger.setContext(AuthLocalStrategy.name);
  }

  async validate(
    req: Request,
    username: string,
    password: string,
  ): Promise<User> {
    try {
      const user: User = await req.prisma.user.signIn(username, password);

      this.logger
        .setReq(req)
        .log(`User validated: ${LoggerService.userToStr(user)}`);

      return user;
    } catch (error) {
      this.logger
        .setReq(req)
        .error(
          `Validation failed for "${username}": ${(error as Error).message}`,
        );

      throw new UnauthorizedException();
    }
  }
}
