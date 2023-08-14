import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule as ThrottlerModuleBase } from '@nestjs/throttler';

import { LoggerService } from '../logger/logger.service';
import { ThrottlerGuard } from './throttler.guard';

@Module({
  imports: [
    ThrottlerModuleBase.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        ttl: config.get<number>('THROTTLER_TTL'),
        limit: config.get<number>('THROTTLER_LIMIT'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ThrottlerGuard, LoggerService],
  exports: [ThrottlerGuard],
})
export class ThrottlerModule {}
