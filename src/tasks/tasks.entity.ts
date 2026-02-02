import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { TaskPriority, TaskStatus, TaskTimePeriod } from '../enum';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tasks')
export class Task {
  @ApiProperty({ description: '任务ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude() // 避免在序列化时暴露用户ID
  @Column()
  user_id: number;

  @Exclude()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '任务标题' })
  @Column({ length: 100 })
  title: string;

  @ApiProperty({ description: '任务描述' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ 
    description: '任务状态',
    enum: TaskStatus 
  })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.Pending,
  })
  status: TaskStatus;

  @ApiProperty({ 
    description: '任务优先级',
    enum: TaskPriority 
  })
  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.Medium })
  priority: TaskPriority;

  @ApiProperty({ description: '重要程度' })
  @Column({ type: 'tinyint', default: 3, unsigned: true })
  importance: number;

  @ApiProperty({ description: '紧急程度' })
  @Column({ type: 'tinyint', default: 3, unsigned: true })
  urgency: number;

  @ApiProperty({ 
    description: '时间周期',
    enum: TaskTimePeriod 
  })
  @Expose({ name: 'timePeriod' })
  @Column({ type: 'enum', enum: TaskTimePeriod, default: TaskTimePeriod.Week })
  time_period: TaskTimePeriod;

  @ApiProperty({ description: '创建时间' })
  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({ description: '是否删除' })
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;
}
