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
import { BillCategory, PayType } from '../enum';

@Entity('transactions')
export class Transaction {
  @ApiProperty({ description: '交易记录ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude()
  @Column()
  user_id: number;

  @Exclude()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '账单ID' })
  @Expose({ name: 'billId' })
  @Column()
  bill_id: string;

  @ApiProperty({ 
    description: '支付平台',
    enum: PayType 
  })
  @Column({ type: 'enum', enum: PayType })
  platform: string;

  @ApiProperty({ description: '店铺名称' })
  @Column()
  shop: string;

  @ApiProperty({ description: '产品名称' })
  @Column()
  product: string;

  @ApiProperty({ 
    description: '交易类型',
    enum: BillCategory 
  })
  @Column({ type: 'enum', enum: BillCategory, default: BillCategory.Neutral })
  type: BillCategory;

  @ApiProperty({ description: '交易金额' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ description: '交易分类' })
  @Column()
  category: string;

  @ApiProperty({ description: '交易描述' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: '交易日期' })
  @Expose({ name: 'transactionDate' })
  @Column({
    name: 'transaction_date',
    type: 'datetime', // 明确类型，避免默认值歧义
    precision: 3, // 保留毫秒精度（和 ISO 格式一致）
    nullable: true, // 允许空值（根据业务调整）
  })
  transaction_date: Date;

  @ApiProperty({ description: '交易开始日期' })
  @Expose({ name: 'transactionStartDate' })
  @Column({
    type: 'datetime', // 明确类型，避免默认值歧义
    precision: 3, // 保留毫秒精度（和 ISO 格式一致）
  })
  transaction_start_date: Date;

  @ApiProperty({ description: '交易结束日期' })
  @Expose({ name: 'transactionEndDate' })
  @Column({
    type: 'datetime', // 明确类型，避免默认值歧义
    precision: 3, // 保留毫秒精度（和 ISO 格式一致）
  })
  transaction_end_date: Date;

  @ApiProperty({ description: '创建时间' })
  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;
}
