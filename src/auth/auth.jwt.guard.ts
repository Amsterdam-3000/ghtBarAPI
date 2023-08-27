import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import { User } from '@prisma/client';

import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AuthJwtGuard extends AuthGuard('jwt') {
  constructor(
    options: AuthModuleOptions,
    private logger: LoggerService,
  ) {
    super(options);
    this.logger.setContext(AuthJwtGuard.name);
  }

  handleRequest<TUser = User>(
    err: Error | null,
    user: TUser,
    info: { message: string } | null,
    context: ExecutionContext,
  ): TUser {
    this.logger
      .setReq(context.switchToHttp().getRequest())
      .log(
        `User handled: ${
          user ? LoggerService.userToStr(user as User) : info.message
        }`,
      );

    // Just add user to context (Validate only Authorized resolvers)
    return user;
  }
}
