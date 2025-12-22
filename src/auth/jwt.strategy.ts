import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.entity';
import { jwtConfig } from '../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
      algorithms: [jwtConfig.signOptions!.algorithm],
    } as StrategyOptionsWithRequest);
  }

  // 验证JWT令牌，返回用户信息
  async validate(payload: { sub: number; username: string }): Promise<User> {
    try {
      return await this.usersService.findOne(payload.sub);
    } catch (error) {
      // 如果找不到用户，抛出未授权异常
      throw new UnauthorizedException('Invalid token: User not found');
    }
  }
}
