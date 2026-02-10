import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { validateDateRange } from '../utils/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Paginate, paginate } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionStatisticsDto,
} from './transactions.dto';
import { Transaction } from './transactions.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCurrentUser } from '../auth/get-current-user.decorator';
import { User } from '../users/users.entity';

@ApiTags('Transactions')
@Controller('api/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: '创建交易记录' })
  @ApiResponse({ status: 201, description: '创建成功', type: Transaction })
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @GetCurrentUser() user: User,
  ): Promise<Transaction> {
    return this.transactionsService.create(user.id, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有交易记录' })
  @ApiParam({
    name: 'startDate',
    required: false,
    description: '开始日期，格式：YYYY-MM-DD',
    example: '2025-01-01',
  })
  @ApiParam({
    name: 'endDate',
    required: false,
    description: '结束日期，格式：YYYY-MM-DD',
    example: '2025-01-31',
  })
  async findAll(
    @Paginate() query: PaginateQuery,
    @GetCurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // 验证日期格式和逻辑
    try {
      validateDateRange(startDate, endDate);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    return paginate(
      query,
      this.transactionsService.getTransactionsQueryBuilder(
        user.id,
        startDate,
        endDate,
      ),
      {
        sortableColumns: ['transaction_date', 'amount', 'category'],
        searchableColumns: ['description', 'category'],
        defaultSortBy: [['transaction_date', 'DESC']],
      },
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取交易统计' })
  @ApiParam({
    name: 'startDate',
    required: false,
    description: '开始日期，格式：YYYY-MM-DD',
    example: '2025-01-01',
  })
  @ApiParam({
    name: 'endDate',
    required: false,
    description: '结束日期，格式：YYYY-MM-DD',
    example: '2025-01-31',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: TransactionStatisticsDto,
  })
  async getStatistics(
    @GetCurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TransactionStatisticsDto> {
    // 验证日期格式和逻辑
    try {
      validateDateRange(startDate, endDate);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    return this.transactionsService.getStatistics(user.id, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个交易记录' })
  @ApiParam({ name: 'id', description: '交易记录ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: Transaction })
  async findOne(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<Transaction> {
    return this.transactionsService.findOne(+id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新交易记录' })
  @ApiParam({ name: 'id', description: '交易记录ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: Transaction })
  async update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @GetCurrentUser() user: User,
  ): Promise<Transaction> {
    return this.transactionsService.update(+id, user.id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除交易记录' })
  @ApiParam({ name: 'id', description: '交易记录ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<void> {
    return this.transactionsService.remove(+id, user.id);
  }
}
