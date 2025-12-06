import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavingsGoal } from './savings-goals.entity';
import { CreateSavingsGoalDto, UpdateSavingsGoalDto, UpdateSavingsGoalAmountDto, SavingsGoalProgressDto } from './savings-goals.dto';

@Injectable()
export class SavingsGoalsService {
  constructor(
    @InjectRepository(SavingsGoal)
    private savingsGoalsRepository: Repository<SavingsGoal>,
  ) {}

  // 创建攒钱目标
  async create(user_id: number, createSavingsGoalDto: CreateSavingsGoalDto): Promise<SavingsGoal> {
    const savingsGoal = this.savingsGoalsRepository.create({ ...createSavingsGoalDto, user_id });
    return this.savingsGoalsRepository.save(savingsGoal);
  }

  // 获取用户的所有攒钱目标
  async findAllByUserId(user_id: number): Promise<SavingsGoal[]> {
    return this.savingsGoalsRepository.find({ where: { user_id }, order: { created_at: 'DESC' } });
  }

  // 根据ID获取攒钱目标
  async findOne(id: number, user_id: number): Promise<SavingsGoal> {
    const savingsGoal = await this.savingsGoalsRepository.findOne({ where: { id, user_id } });
    if (!savingsGoal) {
      throw new NotFoundException(`Savings goal with ID ${id} not found`);
    }
    return savingsGoal;
  }

  // 更新攒钱目标
  async update(id: number, user_id: number, updateSavingsGoalDto: UpdateSavingsGoalDto): Promise<SavingsGoal> {
    const savingsGoal = await this.findOne(id, user_id);
    const updatedSavingsGoal = { ...savingsGoal, ...updateSavingsGoalDto };
    return this.savingsGoalsRepository.save(updatedSavingsGoal);
  }

  // 删除攒钱目标
  async remove(id: number, user_id: number): Promise<void> {
    const result = await this.savingsGoalsRepository.delete({ id, user_id });
    if (result.affected === 0) {
      throw new NotFoundException(`Savings goal with ID ${id} not found`);
    }
  }

  // 更新攒钱目标当前金额
  async updateAmount(id: number, user_id: number, updateSavingsGoalAmountDto: UpdateSavingsGoalAmountDto): Promise<SavingsGoal> {
    const savingsGoal = await this.findOne(id, user_id);
    savingsGoal.current_amount = updateSavingsGoalAmountDto.current_amount;
    
    // 检查目标是否完成
    if (parseFloat(savingsGoal.current_amount.toString()) >= parseFloat(savingsGoal.target_amount.toString())) {
      savingsGoal.status = 'completed';
    } else if (new Date() > savingsGoal.end_date) {
      savingsGoal.status = 'failed';
    } else {
      savingsGoal.status = 'in_progress';
    }
    
    return this.savingsGoalsRepository.save(savingsGoal);
  }

  // 获取攒钱目标进度
  async getProgress(id: number, user_id: number): Promise<SavingsGoalProgressDto> {
    const savingsGoal = await this.findOne(id, user_id);
    
    // 计算进度百分比
    const progress_percentage = parseFloat(savingsGoal.target_amount.toString()) > 0
      ? (parseFloat(savingsGoal.current_amount.toString()) / parseFloat(savingsGoal.target_amount.toString())) * 100
      : 0;
    
    // 计算剩余天数
    const now = new Date();
    const end_date = new Date(savingsGoal.end_date);
    const time_diff = end_date.getTime() - now.getTime();
    const days_left = Math.ceil(time_diff / (1000 * 3600 * 24));
    
    return {
      id: savingsGoal.id,
      name: savingsGoal.name,
      target_amount: parseFloat(savingsGoal.target_amount.toString()),
      current_amount: parseFloat(savingsGoal.current_amount.toString()),
      progress_percentage: parseFloat(progress_percentage.toFixed(2)),
      days_left: Math.max(0, days_left),
      status: savingsGoal.status,
    };
  }
}
