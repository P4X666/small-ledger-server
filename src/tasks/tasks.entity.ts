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

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude() // 避免在序列化时暴露用户ID
  @Column()
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.Pending,
  })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.Medium })
  priority: TaskPriority;

  @Column({ default: 3 })
  importance: number;

  @Column({ default: 3 })
  urgency: number;

  @Expose({ name: 'timePeriod' })
  @Column({ type: 'enum', enum: TaskTimePeriod, default: TaskTimePeriod.Week })
  time_period: TaskTimePeriod;

  @Expose({ name: 'dueDate' })
  @Column({ nullable: true })
  due_date: Date;

  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;
}
