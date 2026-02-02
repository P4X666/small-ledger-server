import { Exclude, Expose } from 'class-transformer';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户名' })
  @Column({ unique: true, nullable: false, length: 50 })
  username: string;

  @Exclude()
  @Column({ nullable: false, length: 255 })
  password: string;

  @ApiProperty({ description: '创建时间' })
  @Expose({ name: 'createdAt' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose({ name: 'updatedAt' })
  @UpdateDateColumn()
  updated_at: Date;
}
