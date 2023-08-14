import { Request } from 'express';
import {
  Controller,
  Post,
  Request as RequestParam,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@RequestParam() req: Request) {
    return await this.authService.login(req);
  }
}
