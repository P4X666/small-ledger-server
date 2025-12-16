import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

// 创建任务DTO
export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed'])
  status?: 'pending' | 'in_progress' | 'completed';

  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  priority?: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  importance?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  urgency?: number;

  @IsOptional()
  @IsEnum(['week', 'month', 'year'])
  time_period?: 'week' | 'month' | 'year';

  @IsOptional()
  @IsDateString()
  due_date?: Date;
}

// 更新任务DTO
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed'])
  status?: 'pending' | 'in_progress' | 'completed';

  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  priority?: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  importance?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  urgency?: number;

  @IsOptional()
  @IsEnum(['week', 'month', 'year'])
  time_period?: 'week' | 'month' | 'year';

  @IsOptional()
  @IsDateString()
  due_date?: Date;
}

// 更新任务状态DTO
export class UpdateTaskStatusDto {
  @IsEnum(['pending', 'in_progress', 'completed'])
  status: 'pending' | 'in_progress' | 'completed';
}
