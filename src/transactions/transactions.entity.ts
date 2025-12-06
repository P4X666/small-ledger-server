import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ['income', 'expense'] })
  type: 'income' | 'expense';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  transaction_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
