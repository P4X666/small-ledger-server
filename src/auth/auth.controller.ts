import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto, LoginUserDto } from '../users/users.dto';
import { User } from '../users/users.entity';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 用户注册
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto): Promise<User> {
    return this.authService.register(registerUserDto);
  }

  // 用户登录
  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ access_token: string }> {
    return this.authService.login(loginUserDto);
  }
}
