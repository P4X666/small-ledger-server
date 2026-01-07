import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { TaskPriority, TaskStatus, TaskTimePeriod } from '../enum';
import { PartialType } from '@nestjs/mapped-types';

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
  importance: number = 3;

  @IsInt()
  @Min(1)
  @Max(4)
  urgency: number = 3;

  @IsOptional()
  @IsEnum(TaskTimePeriod)
  timePeriod?: TaskTimePeriod;
}

// 更新任务DTO， 所有字段都是可选的
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

// 更新任务状态DTO
export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
