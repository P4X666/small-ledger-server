import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './tasks.entity';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './tasks.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  // 创建任务
  async create(user_id: number, createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({ ...createTaskDto, user_id });
    return this.tasksRepository.save(task);
  }

  // 获取用户的所有任务
  async findAllByUserId(user_id: number): Promise<Task[]> {
    return this.tasksRepository.find({ where: { user_id } });
  }

  // 根据ID获取任务
  async findOne(id: number, user_id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id, user_id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  // 更新任务
  async update(
    id: number,
    user_id: number,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOne(id, user_id);
    const updatedTask = { ...task, ...updateTaskDto };
    return this.tasksRepository.save(updatedTask);
  }

  // 删除任务
  async remove(id: number, user_id: number): Promise<void> {
    const result = await this.tasksRepository.delete({ id, user_id });
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  // 更新任务状态
  async updateStatus(
    id: number,
    user_id: number,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ): Promise<Task> {
    const task = await this.findOne(id, user_id);
    task.status = updateTaskStatusDto.status;
    return this.tasksRepository.save(task);
  }

  // 按时间周期获取任务
  async findByTimePeriod(
    user_id: number,
    period: 'week' | 'month' | 'year',
  ): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { user_id, time_period: period },
    });
  }

  // 按四象限获取任务
  async findByQuadrant(user_id: number): Promise<Task[]> {
    return this.tasksRepository.find({ where: { user_id } });
  }
}
