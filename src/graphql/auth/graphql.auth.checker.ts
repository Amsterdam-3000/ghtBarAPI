import {
  AuthCheckerFn,
  AuthCheckerInterface,
  ResolverData,
} from 'type-graphql';
import { Injectable } from '@nestjs/common';

import { IAppContext } from '../../app/app.model';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class GraphqlAuthChecker implements AuthCheckerInterface<IAppContext> {
  constructor(private logger: LoggerService) {
    this.logger.setContext(GraphqlAuthChecker.name);
  }

  check(data: ResolverData<IAppContext>, roles: string[]) {
    const userAgentChecked = this.checkUserAgent(
      data,
      roles.filter((role) => role.startsWith('AGENT')),
    );
    if (!userAgentChecked) return false;

    roles = roles.filter((role) => !role.startsWith('AGENT'));
    if (!roles.length) return true;

    this.logger
      .setReq(data.context.req)
      .log(
        `${LoggerService.gqlToStr(data)}: checking roles [${[
          roles,
        ]}] for User ${LoggerService.userToStr(data.context.user)}`,
      );

    if (!data.context.user || !roles.includes(data.context.user.role)) {
      return false;
    }
    //TODO Check other approaches for code below
    if (data.context.user.role !== 'USER') {
      return true;
    }
    if (data.root) {
      return this.checkUserOutput(data, roles);
    } else {
      return this.checkUserInput(data, roles);
    }
  }

  private checkUserInput: AuthCheckerFn<IAppContext> = (data) => {
    this.logger
      .setReq(data.context.req)
      .log(
        `${LoggerService.gqlToStr(
          data,
        )}: checking input for User ${LoggerService.userUniqToStr(
          data.context.user,
        )}`,
      );

    if (data.info.returnType['name'] !== 'User') {
      return false;
    }
    return (
      data.args?.where?.id === data.context.user.id ||
      data.args?.where?.name === data.context.user.name ||
      data.args?.where?.email === data.context.user.email
    );
  };
  private checkUserOutput: AuthCheckerFn<IAppContext> = (data) => {
    const userId =
      data.info.path.typename === 'User' ? data.root.id : data.root.userId;

    this.logger
      .setReq(data.context.req)
      .log(
        `${LoggerService.gqlToStr(
          data,
        )}: checking User(${userId}) field for User ${LoggerService.userUniqToStr(
          data.context.user,
        )}`,
      );

    return userId === data.context.user.id;
  };

  private checkUserAgent: AuthCheckerFn<IAppContext> = (data, roles) => {
    if (!roles.length) return true;

    this.logger
      .setReq(data.context.req)
      .log(
        `${LoggerService.gqlToStr(data)}: checking User Agent ${JSON.stringify(
          data.context.req.useragent,
        )}`,
      );

    for (const role of roles) {
      if (role === 'AGENT_USER' && data.context.req.useragent.isBot)
        return false;
    }
    return true;
  };
}
