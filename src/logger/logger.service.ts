import { Request } from 'express';
import { ResolverData } from 'type-graphql';
import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  protected req: Request;

  static userToStr(user: User): string {
    return JSON.stringify((({ name, role }) => ({ name, role }))(user));
  }

  static userUniqToStr(user: User): string {
    return JSON.stringify(
      (({ id, name, email }) => ({ id, name, email }))(user),
    );
  }

  static gqlToStr(data: ResolverData): string {
    const pathString = `GraphQL ${data.info.path.typename} "${data.info.path.key}"`;
    if (Object.keys(data.args).length) {
      return `${pathString} ${JSON.stringify(data.args)}`;
    } else {
      return pathString;
    }
  }

  setReq(req: Request) {
    this.req = req;
    return this;
  }

  protected getReqMessage(): string {
    const ip = this.req.ips.length ? this.req.ips[0] : this.req.ip;
    const reqString = `HTTP Request "${this.req.method} ${this.req.originalUrl} HTTP/${this.req.httpVersion}"`;
    const fromString = `from [${ip}]`;
    return `${reqString} ${fromString}`;
  }

  protected verboseReq(context?: string) {
    if (!this.req) return;
    const message = this.getReqMessage();
    const args = context ? [message, context] : [message];
    super.verbose.call(this, ...args);
  }

  log(message: string, context?: string) {
    this.verboseReq(context);
    const args = context ? [message, context] : [message];
    super.log.call(this, ...args);
  }

  info(message: string, context?: string) {
    this.log(message, context);
  }

  error(message: string, context?: string) {
    this.verboseReq(context);
    const args = context ? [message, context] : [message];
    super.error.call(this, ...args);
  }

  warn(message: string, context?: string) {
    this.verboseReq(context);
    const args = context ? [message, context] : [message];
    super.warn.call(this, ...args);
  }
}
