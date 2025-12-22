import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto, LoginUserDto } from '../users/users.dto';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 用户注册
  @Post('register')
  @UseGuards(ThrottlerGuard)
  async register(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.authService.register(registerUserDto);
    // 生成access_token
    const { access_token } = this.authService.generateToken(user);
    return {
      access_token,
      user,
    };
  }

  // 用户登录
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @HttpCode(200)
  async login(@Body() loginUserDto: LoginUserDto) {
    const { access_token, user } = await this.authService.login(loginUserDto);
    return {
      access_token,
      user,
    };
  }
}
