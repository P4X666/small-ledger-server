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
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SavingsGoalPeriod, SavingsGoalStatus } from '@/enum';

@Entity('savings_goals')
export class SavingsGoal {
  @ApiProperty({ description: '攒钱目标ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude()
  @Column()
  user_id: number;

  @Exclude()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '攒钱目标名称' })
  @Column()
  name: string;

  @ApiProperty({ description: '目标金额', name: 'targetAmount' })
  @Expose({ name: 'targetAmount' })
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  target_amount: number;

  @ApiProperty({ description: '当前金额', name: 'currentAmount' })
  @Expose({ name: 'currentAmount' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  current_amount: number;

  @ApiProperty({
    description: '攒钱周期',
    enum: SavingsGoalPeriod,
  })
  @Column({
    type: 'enum',
    enum: SavingsGoalPeriod,
  })
  period: SavingsGoalPeriod;

  @ApiProperty({ description: '开始日期', name: 'startDate' })
  @Expose({ name: 'startDate' })
  @Column()
  start_date: Date;

  @ApiProperty({ description: '结束日期', name: 'endDate' })
  @Expose({ name: 'endDate' })
  @Column()
  end_date: Date;

  @ApiProperty({
    description: '状态',
    enum: SavingsGoalStatus,
  })
  @Column({
    type: 'enum',
    enum: SavingsGoalStatus,
    default: SavingsGoalStatus.InProgress,
  })
  status: SavingsGoalStatus;

  @ApiProperty({ description: '描述' })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ description: '创建时间', name: 'createdAt' })
  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: '更新时间', name: 'updatedAt' })
  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;
}
