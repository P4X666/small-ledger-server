import { JwtModuleOptions } from '@nestjs/jwt';

/**
 * JWT配置选项
 * 统一管理JWT相关配置，确保所有模块使用相同的配置
 */
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256',
  },
} as JwtModuleOptions;
