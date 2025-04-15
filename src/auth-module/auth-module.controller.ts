import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthModuleService } from './auth-module.service';
import { AuthGuard } from './auth.guard';
import { Request, Response } from 'express';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('auth')
export class AuthModuleController {
  constructor(private readonly authService: AuthModuleService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.username,
      registerDto.password,
    );
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return this.authService.login(loginDto.username, loginDto.password, res);
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    return this.authService.refreshToken(req, res);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  getProfile(@Req() request: RequestWithUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { message: 'You are authenticated!', user: request.user };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: RequestWithUser, @Res() res: Response) {
    await this.authService.logout(req.user.id);
    res.clearCookie('refreshToken');
    return res.json({ message: 'Logout successful' });
  }
}
