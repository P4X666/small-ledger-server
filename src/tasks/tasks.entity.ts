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

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

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
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  })
  status: 'pending' | 'in_progress' | 'completed';

  @Column({ type: 'enum', enum: ['high', 'medium', 'low'], default: 'medium' })
  priority: 'high' | 'medium' | 'low';

  @Column({ default: 2 })
  importance: number;

  @Column({ default: 2 })
  urgency: number;

  @Column({ type: 'enum', enum: ['week', 'month', 'year'], default: 'week' })
  time_period: 'week' | 'month' | 'year';

  @Column({ nullable: true })
  due_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
