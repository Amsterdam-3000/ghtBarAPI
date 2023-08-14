import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '../logger/logger.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthLocalStrategy } from './auth.local.strategy';
import { AuthJwtStrategy } from './auth.jwt.strategy';
import { AuthJwtGuard } from './auth.jwt.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    LoggerService,
    AuthService,
    AuthLocalStrategy,
    AuthJwtStrategy,
    AuthJwtGuard,
  ],
  exports: [AuthService, AuthJwtGuard],
  controllers: [AuthController],
})
export class AuthModule {}
