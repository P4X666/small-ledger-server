import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { TaskPriority, TaskStatus, TaskTimePeriod } from '../enum';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 创建任务DTO
export class CreateTaskDto {
  @ApiProperty({ description: '任务标题' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '任务描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '任务状态', enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ description: '任务优先级', enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({
    description: '任务重要性',
    minimum: 1,
    maximum: 4,
    default: 3,
  })
  @IsInt()
  @Min(1)
  @Max(4)
  importance: number = 3;

  @ApiProperty({
    description: '任务紧急性',
    minimum: 1,
    maximum: 4,
    default: 3,
  })
  @IsInt()
  @Min(1)
  @Max(4)
  urgency: number = 3;

  @ApiPropertyOptional({ description: '任务时间周期', enum: TaskTimePeriod })
  @IsOptional()
  @IsEnum(TaskTimePeriod)
  timePeriod?: TaskTimePeriod;
}

// 更新任务DTO， 所有字段都是可选的
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

// 更新任务状态DTO
export class UpdateTaskStatusDto {
  @ApiProperty({ description: '任务状态', enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
