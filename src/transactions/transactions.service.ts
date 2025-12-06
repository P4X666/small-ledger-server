import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transactions.entity';
import { CreateTransactionDto, UpdateTransactionDto, TransactionStatisticsDto } from './transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  // 创建交易记录
  async create(user_id: number, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionsRepository.create({ ...createTransactionDto, user_id });
    return this.transactionsRepository.save(transaction);
  }

  // 获取用户的所有交易记录
  async findAllByUserId(user_id: number): Promise<Transaction[]> {
    return this.transactionsRepository.find({ where: { user_id }, order: { transaction_date: 'DESC' } });
  }

  // 根据ID获取交易记录
  async findOne(id: number, user_id: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({ where: { id, user_id } });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  // 更新交易记录
  async update(id: number, user_id: number, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id, user_id);
    const updatedTransaction = { ...transaction, ...updateTransactionDto };
    return this.transactionsRepository.save(updatedTransaction);
  }

  // 删除交易记录
  async remove(id: number, user_id: number): Promise<void> {
    const result = await this.transactionsRepository.delete({ id, user_id });
    if (result.affected === 0) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
  }

  // 获取交易统计
  async getStatistics(user_id: number): Promise<TransactionStatisticsDto> {
    const transactions = await this.transactionsRepository.find({ where: { user_id } });
    
    // 计算总收入和总支出
    const total_income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const total_expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const balance = total_income - total_expense;
    
    // 计算各分类统计
    const categoryMap = new Map<string, number>();
    transactions.forEach(t => {
      const key = `${t.type}-${t.category}`;
      const current = categoryMap.get(key) || 0;
      categoryMap.set(key, current + parseFloat(t.amount.toString()));
    });
    
    const category_stats: { [key: string]: { amount: number; percentage: number } } = {};
    categoryMap.forEach((amount, key) => {
      const [type, category] = key.split('-');
      const total = type === 'income' ? total_income : total_expense;
      const percentage = total > 0 ? (amount / total) * 100 : 0;
      category_stats[key] = { amount, percentage: parseFloat(percentage.toFixed(2)) };
    });
    
    return {
      total_income,
      total_expense,
      balance,
      category_stats,
    };
  }
}
