import { IsString, IsOptional, IsNotEmpty, MinLength } from 'class-validator';

// 注册用户DTO
export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

// 登录用户DTO
export class LoginUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

// 更新用户DTO
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
