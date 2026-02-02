import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 注册用户DTO
export class RegisterUserDto {
  @ApiProperty({ description: '用户名', minLength: 3, maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '密码', minLength: 6, maxLength: 255 })
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
