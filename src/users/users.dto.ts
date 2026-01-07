import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

// 注册用户DTO
export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}

// 登录用户DTO
export class LoginUserDto extends RegisterUserDto {}

// 更新用户DTO
export class UpdateUserDto extends PartialType(RegisterUserDto) {}
