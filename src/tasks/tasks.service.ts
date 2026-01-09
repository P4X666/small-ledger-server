import { Injectable } from '@nestjs/common';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common/exceptions';
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

  // 获取用户的任务（支持分页）
  getTasksQueryBuilder(user_id: number) {
    return (
      this.tasksRepository
        .createQueryBuilder('task')
        .where('task.user_id = :user_id', { user_id })
        // 第一步：按状态排序，in_progress 排在最前面
        .addOrderBy(
          `CASE task.status WHEN :statusInProgress THEN 0 ELSE 1 END`,
          'ASC',
        )
        // 第二步：按自定义优先级排序
        .addOrderBy(
          `CASE 
          WHEN task.importance = :importance4 AND task.urgency = :urgency4 THEN 0 
          WHEN task.urgency = :urgency4 THEN 1 
          WHEN task.importance = :importance4 THEN 2 
          WHEN task.importance = :importance3 AND task.urgency = :urgency3 THEN 3 
          ELSE 4 
        END`,
          'ASC',
        )
        .setParameters({
          statusInProgress: TaskStatus.InProgress,
          importance4: 4,
          urgency4: 4,
          importance3: 3,
          urgency3: 3,
        })
    );
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
    return savedTask;
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
    const first: Task[] = [];
    const second: Task[] = [];
    const third: Task[] = [];
    const fourth: Task[] = [];
    allTasks.forEach((task) => {
      if (task.importance === 4 && task.urgency === 4) {
        first.push(task);
      } else if (task.importance === 4 && task.urgency < 4) {
        second.push(task);
      } else if (task.importance < 4 && task.urgency === 4) {
        third.push(task);
      } else {
        fourth.push(task);
      }
    });

    // 按四象限分组
    return {
      first,
      second,
      third,
      fourth,
    };
  }

  // 获取任务统计数据
  async getTasksStatistics(user_id: number): Promise<{
    allTasksTotal: number;
    inProgressTasksTotal: number;
    highPriorityTasksTotal: number;
  }> {
    // 使用查询构建器高效查询统计数据
    const [allTasksTotal, inProgressTasksTotal, highPriorityTasksTotal] =
      await Promise.all([
        // 计算所有任务总数
        this.tasksRepository.count({ where: { user_id } }),
        // 计算状态为待完成的任务总数
        this.tasksRepository.count({
          where: { user_id, status: TaskStatus.InProgress },
        }),
        // 计算高优先级任务总数
        this.tasksRepository.count({
          where: { user_id, importance: 4, urgency: 4 },
        }),
      ]);

    return {
      allTasksTotal,
      inProgressTasksTotal,
      highPriorityTasksTotal,
    };
  }
}
