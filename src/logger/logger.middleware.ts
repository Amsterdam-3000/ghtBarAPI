import { NextFunction, Request, Response } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';

import { LoggerService } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {
    this.logger.setContext(LoggerMiddleware.name);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const { ...headers } = req.headers;
    delete headers['authorization'];
    this.logger
      .setReq(req)
      .log(`HTTP Request ${JSON.stringify(headers)} started`);
    res.on('finish', () => {
      this.logger
        .setReq(req)
        .log(
          `HTTP Response ${JSON.stringify(res.getHeaders())} sent with status ${
            res.statusCode
          }`,
        );
    });
    next();
  }
}
