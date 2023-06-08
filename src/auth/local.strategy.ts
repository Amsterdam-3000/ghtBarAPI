import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { PrismaClient } from '../prisma/prisma.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor() {
    //Prisma instance added to context
    super({ passReqToCallback: true });
  }

  async validate(
    { prisma }: Record<'prisma', PrismaClient>,
    username: string,
    password: string,
  ): Promise<any> {
    try {
      //TODO move validation to AuthService
      return await prisma.user.signIn(username, password);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
