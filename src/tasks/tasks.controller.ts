import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './tasks.dto';
import { Task } from './tasks.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCurrentUser } from '../auth/get-current-user.decorator';
import { User } from '../users/users.entity';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @GetCurrentUser() user: User): Promise<Task> {
    return this.tasksService.create(user.id, createTaskDto);
  }

  @Get()
  async findAll(@GetCurrentUser() user: User): Promise<Task[]> {
    return this.tasksService.findAllByUserId(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @GetCurrentUser() user: User): Promise<Task> {
    return this.tasksService.findOne(+id, user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @GetCurrentUser() user: User): Promise<Task> {
    return this.tasksService.update(+id, user.id, updateTaskDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetCurrentUser() user: User): Promise<void> {
    return this.tasksService.remove(+id, user.id);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateTaskStatusDto: UpdateTaskStatusDto, @GetCurrentUser() user: User): Promise<Task> {
    return this.tasksService.updateStatus(+id, user.id, updateTaskStatusDto);
  }

  @Get('by-time/:period')
  async findByTimePeriod(@Param('period') period: 'week' | 'month' | 'year', @GetCurrentUser() user: User): Promise<Task[]> {
    return this.tasksService.findByTimePeriod(user.id, period);
  }

  @Get('by-quadrant')
  async findByQuadrant(@GetCurrentUser() user: User): Promise<Task[]> {
    return this.tasksService.findByQuadrant(user.id);
  }
}
