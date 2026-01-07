import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Paginate, paginate } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './tasks.dto';
import { Task } from './tasks.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCurrentUser } from '../auth/get-current-user.decorator';
import { User } from '../users/users.entity';
import type { TaskTimePeriod } from '../enum';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @GetCurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.create(user.id, createTaskDto);
  }

  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
    @GetCurrentUser() user: User,
  ) {
    return paginate(
      query,
      this.tasksService.getTasksQueryBuilder(user.id),
      {
        sortableColumns: ['id', 'title', 'status', 'importance', 'urgency'],
        searchableColumns: ['title', 'description'],
      },
    );
  }

  @Get('by-time/:period')
  async findByTimePeriod(
    @Param('period') period: TaskTimePeriod,
    @GetCurrentUser() user: User,
  ): Promise<Task[]> {
    return this.tasksService.findByTimePeriod(user.id, period);
  }

  @Get('by-quadrant')
  async findByQuadrant(@GetCurrentUser() user: User): Promise<{
    first: Task[];
    second: Task[];
    third: Task[];
    fourth: Task[];
  }> {
    return this.tasksService.findByQuadrant(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.findOne(+id, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @GetCurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.update(+id, user.id, updateTaskDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ): Promise<void> {
    return this.tasksService.remove(+id, user.id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @GetCurrentUser() user: User,
  ): Promise<Task> {
    return this.tasksService.updateStatus(+id, user.id, updateTaskStatusDto);
  }
}
