import { Injectable } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './tasks.entity';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './tasks.dto';
import { TaskStatus, type TaskTimePeriod } from '../enum';
import { getPriorityValue } from '../utils/common';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  // 创建任务
  async create(user_id: number, createTaskDto: CreateTaskDto): Promise<Task> {
    // 检查任务名称是否已存在
    const existingTask = await this.tasksRepository.findOne({
      where: { title: createTaskDto.title, user_id },
    });
    if (existingTask && existingTask.status !== TaskStatus.Pending) {
      throw new ConflictException('Task title already exists');
    }

    const priority = getPriorityValue({
      importance: createTaskDto.importance,
      urgency: createTaskDto.urgency,
    });

    const newTask: Partial<Task> = {
      ...createTaskDto,
      user_id,
      status: TaskStatus.InProgress,
      priority,
    };

    const task = this.tasksRepository.create(newTask);
    const savedTask = await this.tasksRepository.save(task);
    return savedTask;
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
    const savedTask = await this.tasksRepository.save(updatedTask);
    return savedTask as Task;
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
    const savedTask = await this.tasksRepository.save(task);
    return savedTask as Task;
  }

  // 按时间周期获取任务
  async findByTimePeriod(
    user_id: number,
    period: TaskTimePeriod,
  ): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { user_id, time_period: period },
    });
  }

  // 按四象限获取任务
  async findByQuadrant(user_id: number): Promise<{
    first: Task[];
    second: Task[];
    third: Task[];
    fourth: Task[];
  }> {
    const allTasks = await this.tasksRepository.find({ where: { user_id } });
    const first: Task[] = []
    const second: Task[] = []
    const third: Task[] = []
    const fourth: Task[] = []
    allTasks.forEach(task => {
      if (task.importance === 4 && task.urgency === 4) {
        first.push(task)
      } else if (task.importance === 4 && task.urgency < 4) {
        second.push(task)
      } else if (task.importance < 4 && task.urgency === 4) {
        third.push(task)
      } else {
        fourth.push(task)
      }
    })

    // 按四象限分组
    return {
      first,
      second,
      third,
      fourth,
    };
  }
}
