import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';

@Entity()
export class SavingsGoal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  target_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  current_amount: number;

  @Column({ type: 'enum', enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'] })
  period: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column({ type: 'enum', enum: ['in_progress', 'completed', 'failed'], default: 'in_progress' })
  status: 'in_progress' | 'completed' | 'failed';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
