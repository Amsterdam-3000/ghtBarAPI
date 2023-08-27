import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy, Type } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';

import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AuthJwtStrategy extends PassportStrategy<Type<Strategy>>(
  Strategy,
  'jwt',
) {
  constructor(
    private config: ConfigService,
    private logger: LoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
      //Prisma instance added to context
      passReqToCallback: true,
    });
    logger.setContext(AuthJwtStrategy.name);
  }

  async validate(req: Request, payload: User): Promise<User> {
    this.logger
      .setReq(req)
      .log(`User validated: ${LoggerService.userToStr(payload)}`);

    return payload;
  }
}
