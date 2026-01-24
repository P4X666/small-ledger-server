import { BillCategory, PayType } from '../enum';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';

// 创建交易DTO
export class CreateTransactionDto {
  @IsString()
  billId: string;

  @IsEnum(PayType)
  platform: string;

  @IsString()
  shop: string;

  @IsString()
  product: string;

  @IsEnum(BillCategory)
  type: BillCategory;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  @IsOptional()
  transactionDate: Date;

  @IsDateString()
  transactionStartDate: Date;

  @IsDateString()
  transactionEndDate: Date;
}

// 更新交易DTO
export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}

// 交易统计响应DTO
export class TransactionStatisticsDto {
  total_income: number;
  total_expense: number;
  balance: number;
  category_stats: {
    [key: string]: {
      amount: number;
      percentage: number;
    };
  };
}
