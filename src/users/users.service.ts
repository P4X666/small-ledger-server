import { Injectable, UnauthorizedException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { RegisterUserDto, LoginUserDto, UpdateUserDto } from './users.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // 创建用户（注册）
  async register(registerUserDto: RegisterUserDto): Promise<User> {
    // 密码加密
    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    const user = this.usersRepository.create({
      ...registerUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  // 用户登录
  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    // 参数验证
    if (!loginUserDto.username || !loginUserDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 查找用户
    const user = await this.findByUsername(loginUserDto.username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 生成JWT令牌
    const payload = { username: user.username, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  // 通过用户名查找用户
  async findByUsername(username: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { username } });
    return user || undefined;
  }

  // 验证用户（用于JWT认证）
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  // 获取所有用户
  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // 根据ID获取用户
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // 更新用户
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // 如果更新密码，需要重新加密
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = { ...user, ...updateUserDto };
    return this.usersRepository.save(updatedUser);
  }

  // 删除用户
  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
