import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min } from 'class-validator';

// 创建攒钱目标DTO
export class CreateSavingsGoalDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0.01)
  target_amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  current_amount?: number;

  @IsEnum(['monthly', 'quarterly', 'half_yearly', 'yearly'])
  period: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

  @IsDateString()
  start_date: Date;

  @IsDateString()
  end_date: Date;
}

// 更新攒钱目标DTO
export class UpdateSavingsGoalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  target_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  current_amount?: number;

  @IsOptional()
  @IsEnum(['monthly', 'quarterly', 'half_yearly', 'yearly'])
  period?: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @IsOptional()
  @IsDateString()
  end_date?: Date;

  @IsOptional()
  @IsEnum(['in_progress', 'completed', 'failed'])
  status?: 'in_progress' | 'completed' | 'failed';
}

// 更新攒钱目标金额DTO
export class UpdateSavingsGoalAmountDto {
  @IsNumber()
  @Min(0)
  current_amount: number;
}

// 攒钱目标进度DTO
export class SavingsGoalProgressDto {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  progress_percentage: number;
  days_left: number;
  status: 'in_progress' | 'completed' | 'failed';
}
