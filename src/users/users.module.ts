import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './users.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
