import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
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

@Controller('api/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @GetCurrentUser() user: User,
  ): Promise<Transaction> {
    return this.transactionsService.create(user.id, createTransactionDto);
  }

  @Get()
  async findAll(@GetCurrentUser() user: User): Promise<Transaction[]> {
    return this.transactionsService.findAllByUserId(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<Transaction> {
    return this.transactionsService.findOne(+id, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @GetCurrentUser() user: User,
  ): Promise<Transaction> {
    return this.transactionsService.update(+id, user.id, updateTransactionDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<void> {
    return this.transactionsService.remove(+id, user.id);
  }

  @Get('statistics')
  async getStatistics(
    @GetCurrentUser() user: User,
  ): Promise<TransactionStatisticsDto> {
    return this.transactionsService.getStatistics(user.id);
  }
}
