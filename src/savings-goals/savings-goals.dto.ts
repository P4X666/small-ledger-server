import { SavingsGoalPeriod, SavingsGoalStatus } from '@/enum';
import { PartialType, PickType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 创建攒钱目标DTO
export class CreateSavingsGoalDto {
  @ApiProperty({ description: '攒钱目标名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '目标金额', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  targetAmount: number;

  @ApiPropertyOptional({ description: '当前金额', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @ApiProperty({
    description: '攒钱周期',
    enum: SavingsGoalPeriod,
  })
  @IsEnum(SavingsGoalPeriod)
  period: SavingsGoalPeriod;

  @ApiProperty({ description: '开始日期' })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ description: '结束日期' })
  @IsDateString()
  endDate: Date;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '状态',
    enum: SavingsGoalStatus,
  })
  @IsOptional()
  @IsEnum(SavingsGoalStatus)
  status?: SavingsGoalStatus;
}

// 更新攒钱目标DTO
export class UpdateSavingsGoalDto extends PartialType(CreateSavingsGoalDto) {}

// 更新攒钱目标金额DTO
export class UpdateSavingsGoalAmountDto extends PickType(CreateSavingsGoalDto, [
  'currentAmount',
]) {}

// 攒钱目标进度DTO
export class SavingsGoalProgressDto extends PickType(CreateSavingsGoalDto, [
  'name',
  'targetAmount',
  'currentAmount',
  'status',
]) {
  @ApiProperty({ description: '攒钱目标ID' })
  id: number;

  @ApiProperty({ description: '进度百分比' })
  progressPercentage: number;

  @ApiProperty({ description: '剩余天数' })
  daysLeft: number;
}
