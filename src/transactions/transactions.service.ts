import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import currency from 'currency.js';
import { BillCategory } from '../enum';
import { Transaction } from './transactions.entity';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionStatisticsDto,
} from './transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  // 创建交易记录
  async create(
    user_id: number,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const {
      billId,
      transactionDate,
      transactionStartDate,
      transactionEndDate,
      ...rest
    } = createTransactionDto;
    const transaction = this.transactionsRepository.create({
      ...rest,
      bill_id: billId,
      transaction_start_date: transactionStartDate,
      transaction_end_date: transactionEndDate,
      transaction_date: transactionDate || null,
      user_id,
    });
    return this.transactionsRepository.save(transaction);
  }

  // 获取用户的所有交易记录
  async findAllByUserId(user_id: number): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: { user_id },
      order: { transaction_date: 'DESC' },
    });
  }

  // 获取用户的交易记录（支持分页）
  getTransactionsQueryBuilder(user_id: number) {
    return this.transactionsRepository
      .createQueryBuilder('transaction')
      .where('transaction.user_id = :user_id', { user_id })
      .orderBy('transaction.transaction_date', 'DESC');
  }

  // 根据ID获取交易记录
  async findOne(id: number, user_id: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id, user_id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  // 根据billId和user_id获取交易记录
  async findByBillId(
    billId: string,
    user_id: number,
  ): Promise<Transaction | null> {
    return this.transactionsRepository.findOne({
      where: { bill_id: billId, user_id },
    });
  }

  // 更新交易记录
  async update(
    id: number,
    user_id: number,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
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
    const transactions = await this.transactionsRepository.find({
      where: { user_id },
    });

    // 计算总收入和总支出 - 使用currency.js消除浮点精度问题
    const totalIncome = transactions
      .filter((t) => t.type === BillCategory.Income)
      .reduce((sum, t) => sum.add(t.amount), currency(0)).value;

    const totalExpense = transactions
      .filter((t) => t.type === BillCategory.Expense)
      .reduce((sum, t) => sum.add(t.amount), currency(0)).value;

    const totalNeutral = transactions
      .filter((t) => t.type === BillCategory.Neutral)
      .reduce((sum, t) => sum.add(t.amount), currency(0)).value;

    const balance = currency(totalIncome).subtract(totalExpense).value;

    // 计算各分类统计
    const categoryMap = new Map<string, number>();
    transactions.forEach((t) => {
      const key = t.type;
      const current = categoryMap.get(key) || 0;
      const newAmount = currency(current).add(t.amount).value;
      categoryMap.set(key, newAmount);
    });

    const categoryStats: {
      [key: string]: { amount: number; percentage: number };
    } = {};
    categoryMap.forEach((amount, key) => {
      let total = 0;

      if (key === BillCategory.Income) {
        total = totalIncome;
      } else if (key === BillCategory.Expense) {
        total = totalExpense;
      } else if (key === BillCategory.Neutral) {
        total = totalNeutral;
      }

      const percentage =
        total > 0 ? parseFloat(((amount / total) * 100).toFixed(2)) : 0;
      categoryStats[key] = {
        amount,
        percentage,
      };
    });

    return {
      totalIncome,
      totalExpense,
      totalNeutral,
      balance,
      categoryStats,
    };
  }
}
