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
import { BillCategory, PayType } from '../enum';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude()
  @Column()
  user_id: number;

  @Exclude()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Expose({ name: 'billId' })
  @Column()
  bill_id: string;

  @Column({ type: 'enum', enum: PayType })
  platform: string;

  @Column()
  shop: string;

  @Column()
  product: string;

  @Column({ type: 'enum', enum: BillCategory, default: BillCategory.Neutral })
  type: BillCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  description: string;

  @Expose({ name: 'transactionDate' })
  @Column({
    name: 'transaction_date',
    type: 'datetime', // 明确类型，避免默认值歧义
    precision: 3, // 保留毫秒精度（和 ISO 格式一致）
    nullable: true, // 允许空值（根据业务调整）
  })
  transaction_date: Date;

  @Expose({ name: 'transactionStartDate' })
  @Column({
    type: 'datetime', // 明确类型，避免默认值歧义
    precision: 3, // 保留毫秒精度（和 ISO 格式一致）
  })
  transaction_start_date: Date;

  @Expose({ name: 'transactionEndDate' })
  @Column({
    type: 'datetime', // 明确类型，避免默认值歧义
    precision: 3, // 保留毫秒精度（和 ISO 格式一致）
  })
  transaction_end_date: Date;

  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;
}
