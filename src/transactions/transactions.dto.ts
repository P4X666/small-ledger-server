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
  @IsEnum(['income', 'expense'])
  type: 'income' | 'expense';

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  transaction_date: Date;
}

// 更新交易DTO
export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(['income', 'expense'])
  type?: 'income' | 'expense';

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  transaction_date?: Date;
}

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
