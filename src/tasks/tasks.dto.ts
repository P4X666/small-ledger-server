import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { TaskPriority, TaskStatus, TaskTimePeriod } from '../enum';
import { Transform } from 'class-transformer';

// 创建任务DTO
export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsInt()
  @Min(1)
  @Max(4)
  importance: number;

  @IsInt()
  @Min(1)
  @Max(4)
  urgency: number;

  @IsOptional()
  @IsEnum(TaskTimePeriod)
  time_period?: TaskTimePeriod;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  due_date?: Date;
}

// 更新任务DTO， 所有字段都是可选的
export class UpdateTaskDto extends CreateTaskDto {
  
}

// 更新任务状态DTO
export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
