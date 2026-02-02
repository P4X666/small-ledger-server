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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 创建交易DTO
export class CreateTransactionDto {
  @ApiProperty({ description: '账单ID' })
  @IsString()
  billId: string;

  @ApiProperty({ description: '支付平台', enum: PayType })
  @IsEnum(PayType)
  platform: PayType;

  @ApiProperty({ description: '商店名称' })
  @IsString()
  shop: string;

  @ApiProperty({ description: '产品名称' })
  @IsString()
  product: string;

  @ApiProperty({ description: '交易类型', enum: BillCategory })
  @IsEnum(BillCategory)
  type: BillCategory;

  @ApiProperty({ description: '交易金额', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: '交易分类' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: '交易描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '交易日期' })
  @IsDateString()
  @IsOptional()
  transactionDate: Date;

  @ApiProperty({ description: '交易开始日期' })
  @IsDateString()
  transactionStartDate: Date;

  @ApiProperty({ description: '交易结束日期' })
  @IsDateString()
  transactionEndDate: Date;
}

// 更新交易DTO
export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}

// 交易统计响应DTO
export class TransactionStatisticsDto {
  @ApiProperty({ description: '总收入' })
  totalIncome: number;

  @ApiProperty({ description: '总支出' })
  totalExpense: number;

  @ApiProperty({ description: '总中性交易' })
  totalNeutral: number;

  @ApiProperty({ description: '余额' })
  balance: number;

  @ApiProperty({ description: '分类统计' })
  categoryStats: {
    [key: string]: {
      amount: number;
      percentage: number;
    };
  };
}
