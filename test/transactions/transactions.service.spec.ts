import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from '../../src/transactions/transactions.service';
import { Transaction } from '../../src/transactions/transactions.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from '../../src/transactions/transactions.dto';
import { NotFoundException } from '@nestjs/common';

// Mock factory
const mockRepository = jest.fn(() => ({
  create: jest.fn().mockImplementation((dto: any) => dto),
  save: jest
    .fn()
    .mockImplementation((transaction: any) =>
      Promise.resolve({ id: 1, ...transaction }),
    ),
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
}));

type MockRepository = ReturnType<typeof mockRepository>;

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  let transactionsRepository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    transactionsService = module.get<TransactionsService>(TransactionsService);
    transactionsRepository = module.get(getRepositoryToken(Transaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction for a user', async () => {
      const createDto: CreateTransactionDto = {
        type: 'income',
        amount: 100,
        category: 'salary',
        description: 'Monthly salary',
        transaction_date: new Date(),
      };

      const result = await transactionsService.create(1, createDto);

      expect(transactionsRepository.create).toHaveBeenCalledWith({
        ...createDto,
        user_id: 1,
      });
      expect(transactionsRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.user_id).toBe(1);
    });
  });

  describe('findAllByUserId', () => {
    it('should return all transactions for a user sorted by date descending', async () => {
      const mockTransactions = [
        {
          id: 2,
          user_id: 1,
          type: 'expense',
          amount: 50,
          category: 'food',
          transaction_date: new Date('2023-01-02'),
        },
        {
          id: 1,
          user_id: 1,
          type: 'income',
          amount: 100,
          category: 'salary',
          transaction_date: new Date('2023-01-01'),
        },
      ];

      transactionsRepository.find.mockResolvedValue(mockTransactions as any);

      const result = await transactionsService.findAllByUserId(1);

      expect(transactionsRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: { transaction_date: 'DESC' },
      });
      expect(result).toEqual(mockTransactions);
    });

    it('should return an empty array if no transactions found', async () => {
      transactionsRepository.find.mockResolvedValue([]);

      const result = await transactionsService.findAllByUserId(1);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id for a user', async () => {
      const mockTransaction = {
        id: 1,
        user_id: 1,
        type: 'income',
        amount: 100,
        category: 'salary',
        description: 'Monthly salary',
        transaction_date: new Date(),
      };

      transactionsRepository.findOne.mockResolvedValue(mockTransaction as any);

      const result = await transactionsService.findOne(1, 1);

      expect(transactionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      transactionsRepository.findOne.mockResolvedValue(null);

      await expect(transactionsService.findOne(999, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(transactionsService.findOne(999, 1)).rejects.toThrow(
        'Transaction with ID 999 not found',
      );
    });

    it('should throw NotFoundException if transaction belongs to another user', async () => {
      transactionsRepository.findOne.mockResolvedValue(null);

      await expect(transactionsService.findOne(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a transaction for a user', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 150,
        description: 'Updated salary',
      };

      const mockTransaction = {
        id: 1,
        user_id: 1,
        type: 'income',
        amount: 100,
        category: 'salary',
        description: 'Monthly salary',
        transaction_date: new Date(),
      };

      transactionsRepository.findOne.mockResolvedValue(mockTransaction as any);
      transactionsRepository.save.mockResolvedValue({
        ...mockTransaction,
        ...updateDto,
      } as any);

      const result = await transactionsService.update(1, 1, updateDto);

      expect(transactionsRepository.findOne).toHaveBeenCalled();
      expect(transactionsRepository.save).toHaveBeenCalled();
      expect(result.amount).toBe(updateDto.amount);
      expect(result.description).toBe(updateDto.description);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      transactionsRepository.findOne.mockResolvedValue(null);

      await expect(
        transactionsService.update(999, 1, { amount: 150 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a transaction by id for a user', async () => {
      await transactionsService.remove(1, 1);

      expect(transactionsRepository.delete).toHaveBeenCalledWith({
        id: 1,
        user_id: 1,
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      transactionsRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(transactionsService.remove(999, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(transactionsService.remove(999, 1)).rejects.toThrow(
        'Transaction with ID 999 not found',
      );
    });

    it('should throw NotFoundException if transaction belongs to another user', async () => {
      transactionsRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(transactionsService.remove(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics for user transactions', async () => {
      const mockTransactions = [
        { id: 1, user_id: 1, type: 'income', amount: 1000, category: 'salary' },
        { id: 2, user_id: 1, type: 'income', amount: 500, category: 'bonus' },
        { id: 3, user_id: 1, type: 'expense', amount: 300, category: 'food' },
        {
          id: 4,
          user_id: 1,
          type: 'expense',
          amount: 200,
          category: 'transport',
        },
      ];

      transactionsRepository.find.mockResolvedValue(mockTransactions as any);

      const result = await transactionsService.getStatistics(1);

      expect(transactionsRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
      });
      expect(result.total_income).toBe(1500);
      expect(result.total_expense).toBe(500);
      expect(result.balance).toBe(1000);
      expect(result.category_stats['income-salary']).toEqual({
        amount: 1000,
        percentage: 66.67,
      });
      expect(result.category_stats['income-bonus']).toEqual({
        amount: 500,
        percentage: 33.33,
      });
      expect(result.category_stats['expense-food']).toEqual({
        amount: 300,
        percentage: 60,
      });
      expect(result.category_stats['expense-transport']).toEqual({
        amount: 200,
        percentage: 40,
      });
    });

    it('should return zero values for no transactions', async () => {
      transactionsRepository.find.mockResolvedValue([]);

      const result = await transactionsService.getStatistics(1);

      expect(result.total_income).toBe(0);
      expect(result.total_expense).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.category_stats).toEqual({});
    });

    it('should handle only income transactions', async () => {
      const mockTransactions = [
        { id: 1, user_id: 1, type: 'income', amount: 1000, category: 'salary' },
        { id: 2, user_id: 1, type: 'income', amount: 500, category: 'bonus' },
      ];

      transactionsRepository.find.mockResolvedValue(mockTransactions as any);

      const result = await transactionsService.getStatistics(1);

      expect(result.total_income).toBe(1500);
      expect(result.total_expense).toBe(0);
      expect(result.balance).toBe(1500);
      expect(Object.keys(result.category_stats)).toHaveLength(2);
    });

    it('should handle only expense transactions', async () => {
      const mockTransactions = [
        { id: 1, user_id: 1, type: 'expense', amount: 300, category: 'food' },
        {
          id: 2,
          user_id: 1,
          type: 'expense',
          amount: 200,
          category: 'transport',
        },
      ];

      transactionsRepository.find.mockResolvedValue(mockTransactions as any);

      const result = await transactionsService.getStatistics(1);

      expect(result.total_income).toBe(0);
      expect(result.total_expense).toBe(500);
      expect(result.balance).toBe(-500);
      expect(Object.keys(result.category_stats)).toHaveLength(2);
    });
  });
});
