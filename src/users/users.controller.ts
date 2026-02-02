import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Paginate, paginate } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { UsersService } from './users.service';
import { RegisterUserDto, LoginUserDto, UpdateUserDto } from './users.dto';
import { User } from './users.entity';

@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 用户注册
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功', type: User })
  async register(@Body() registerUserDto: RegisterUserDto): Promise<User> {
    return this.usersService.register(registerUserDto);
  }

  // 用户登录
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: { access_token: { type: 'string' } },
    },
  })
  @HttpCode(200)
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ access_token: string }> {
    return this.usersService.login(loginUserDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有用户' })
  async findAll(@Paginate() query: PaginateQuery) {
    return paginate(query, this.usersService.getUsersQueryBuilder(), {
      sortableColumns: ['id', 'username'],
      searchableColumns: ['username'],
      defaultSortBy: [['id', 'ASC']],
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: User })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: User })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(+id);
  }
}
