import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterUserDto, LoginUserDto } from '../users/users.dto';
import { User } from '../users/users.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 用户注册
  async register(registerUserDto: RegisterUserDto): Promise<User> {
    return this.usersService.register(registerUserDto);
  }

  // 用户登录
  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    return this.usersService.login(loginUserDto);
  }

  // 验证用户
  async validateUser(username: string, password: string): Promise<User | null> {
    return this.usersService.validateUser(username, password);
  }

  // 生成JWT令牌
  async generateToken(user: User): Promise<{ access_token: string }> {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
