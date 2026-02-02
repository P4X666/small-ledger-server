import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Paginate, paginate } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './tasks.dto';
import { Task } from './tasks.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCurrentUser } from '../auth/get-current-user.decorator';
import { User } from '../users/users.entity';
import { TaskStatus, TaskTimePeriod } from '../enum';

@ApiTags('Tasks')
@Controller('api/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: '创建任务' })
  @ApiResponse({ status: 201, description: '创建成功', type: Task })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @GetCurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.create(user.id, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有任务' })
  @ApiQuery({ name: 'timePeriod', required: false, description: '时间周期', enum: TaskTimePeriod })
  async findAll(
    @Paginate() query: PaginateQuery,
    @Query('timePeriod') timePeriod: TaskTimePeriod,
    @GetCurrentUser() user: User,
  ) {
    return paginate(
      query,
      this.tasksService.getTasksQueryBuilder(user.id, timePeriod),
      {
        sortableColumns: ['id', 'title', 'status', 'importance', 'urgency'],
        searchableColumns: ['title', 'description'],
      },
    );
  }

  @Get('by-time/:period')
  @ApiOperation({ summary: '按时间周期获取任务' })
  @ApiParam({ name: 'period', description: '时间周期', enum: TaskTimePeriod })
  @ApiResponse({ status: 200, description: '获取成功', type: [Task] })
  async findByTimePeriod(
    @Param('period') period: TaskTimePeriod,
    @GetCurrentUser() user: User,
  ): Promise<Task[]> {
    return this.tasksService.findByTimePeriod(user.id, period);
  }

  @Get('by-quadrant')
  @ApiOperation({ summary: '按四象限获取任务' })
  async findByQuadrant(@GetCurrentUser() user: User): Promise<{
    first: Task[];
    second: Task[];
    third: Task[];
    fourth: Task[];
  }> {
    return this.tasksService.findByQuadrant(user.id);
  }

  @Get('getTasksNum')
  @ApiOperation({ summary: '获取任务统计' })
  async getTasksStatistics(@GetCurrentUser() user: User): Promise<{
    allTasksTotal: number;
    inProgressTasksTotal: number;
    highPriorityTasksTotal: number;
  }> {
    return this.tasksService.getTasksStatistics(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个任务' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: Task })
  async findOne(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.findOne(+id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新任务' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: Task })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @GetCurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.update(+id, user.id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除任务' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<void> {
    return this.tasksService.remove(+id, user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新任务状态' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: Task })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @GetCurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.updateStatus(+id, user.id, updateTaskStatusDto);
  }

  @Get('deleted')
  @ApiOperation({ summary: '获取已删除任务' })
  @ApiQuery({ name: 'status', required: false, description: '状态', enum: TaskStatus })
  @ApiQuery({ name: 'timePeriod', required: false, description: '时间周期', enum: TaskTimePeriod })
  async findDeletedTasks(
    @Paginate() query: PaginateQuery,
    @Query('status') status: TaskStatus,
    @Query('timePeriod') timePeriod: TaskTimePeriod,
    @GetCurrentUser() user: User,
  ) {
    return paginate(
      query,
      this.tasksService.getDeletedTasksQueryBuilder(
        user.id,
        status,
        timePeriod,
      ),
      {
        sortableColumns: [
          'id',
          'title',
          'status',
          'importance',
          'urgency',
          'updated_at',
        ],
        searchableColumns: ['title', 'description'],
      },
    );
  }
}
