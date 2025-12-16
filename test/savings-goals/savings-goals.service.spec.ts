import { Test, TestingModule } from '@nestjs/testing';
import { SavingsGoalsService } from '../../src/savings-goals/savings-goals.service';
import { SavingsGoal } from '../../src/savings-goals/savings-goals.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  CreateSavingsGoalDto,
  UpdateSavingsGoalDto,
  UpdateSavingsGoalAmountDto,
} from '../../src/savings-goals/savings-goals.dto';
import { NotFoundException } from '@nestjs/common';

// Mock factory
const mockRepository = jest.fn(() => ({
  create: jest.fn().mockImplementation((dto: any) => dto),
  save: jest
    .fn()
    .mockImplementation((goal: any) => Promise.resolve({ id: 1, ...goal })),
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
}));

type MockRepository = ReturnType<typeof mockRepository>;

describe('SavingsGoalsService', () => {
  let savingsGoalsService: SavingsGoalsService;
  let savingsGoalsRepository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavingsGoalsService,
        {
          provide: getRepositoryToken(SavingsGoal),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    savingsGoalsService = module.get<SavingsGoalsService>(SavingsGoalsService);
    savingsGoalsRepository = module.get(getRepositoryToken(SavingsGoal));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new savings goal for a user', async () => {
      const createDto: CreateSavingsGoalDto = {
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 0,
        end_date: new Date('2023-12-31'),
        description: 'Save for summer vacation',
        status: 'in_progress',
        period: 'monthly',
        start_date: new Date('2023-01-01'),
      };

      const result = await savingsGoalsService.create(1, createDto);

      expect(savingsGoalsRepository.create).toHaveBeenCalledWith({
        ...createDto,
        user_id: 1,
      });
      expect(savingsGoalsRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.user_id).toBe(1);
    });
  });

  describe('findAllByUserId', () => {
    it('should return all savings goals for a user sorted by date descending', async () => {
      const mockGoals = [
        {
          id: 2,
          user_id: 1,
          name: 'New Goal',
          created_at: new Date('2023-02-01'),
        },
        {
          id: 1,
          user_id: 1,
          name: 'Old Goal',
          created_at: new Date('2023-01-01'),
        },
      ];

      savingsGoalsRepository.find.mockResolvedValue(mockGoals as any);

      const result = await savingsGoalsService.findAllByUserId(1);

      expect(savingsGoalsRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockGoals);
    });

    it('should return an empty array if no savings goals found', async () => {
      savingsGoalsRepository.find.mockResolvedValue([]);

      const result = await savingsGoalsService.findAllByUserId(1);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a savings goal by id for a user', async () => {
      const mockGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 0,
        status: 'in_progress',
      };

      savingsGoalsRepository.findOne.mockResolvedValue(mockGoal as any);

      const result = await savingsGoalsService.findOne(1, 1);

      expect(savingsGoalsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
      });
      expect(result).toEqual(mockGoal);
    });

    it('should throw NotFoundException if savings goal not found', async () => {
      savingsGoalsRepository.findOne.mockResolvedValue(null);

      await expect(savingsGoalsService.findOne(999, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(savingsGoalsService.findOne(999, 1)).rejects.toThrow(
        'Savings goal with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a savings goal for a user', async () => {
      const updateDto: UpdateSavingsGoalDto = {
        name: 'Updated Vacation Fund',
        description: 'Updated description',
      };

      const mockGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 0,
        description: 'Original description',
        status: 'in_progress',
      };

      savingsGoalsRepository.findOne.mockResolvedValue(mockGoal as any);
      savingsGoalsRepository.save.mockResolvedValue({
        ...mockGoal,
        ...updateDto,
      } as any);

      const result = await savingsGoalsService.update(1, 1, updateDto);

      expect(savingsGoalsRepository.findOne).toHaveBeenCalled();
      expect(savingsGoalsRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateDto.name);
      expect(result.description).toBe(updateDto.description);
    });

    it('should throw NotFoundException if savings goal not found', async () => {
      savingsGoalsRepository.findOne.mockResolvedValue(null);

      await expect(
        savingsGoalsService.update(999, 1, { name: 'Updated Goal' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a savings goal by id for a user', async () => {
      await savingsGoalsService.remove(1, 1);

      expect(savingsGoalsRepository.delete).toHaveBeenCalledWith({
        id: 1,
        user_id: 1,
      });
    });

    it('should throw NotFoundException if savings goal not found', async () => {
      savingsGoalsRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(savingsGoalsService.remove(999, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(savingsGoalsService.remove(999, 1)).rejects.toThrow(
        'Savings goal with ID 999 not found',
      );
    });
  });

  describe('updateAmount', () => {
    it('should update current amount and mark as completed when target is reached', async () => {
      const updateDto: UpdateSavingsGoalAmountDto = {
        current_amount: 5000,
      };

      const mockGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 3000,
        end_date: new Date('2023-12-31'),
        status: 'in_progress',
      };

      savingsGoalsRepository.findOne.mockResolvedValue(mockGoal as any);
      savingsGoalsRepository.save.mockResolvedValue({
        ...mockGoal,
        ...updateDto,
        status: 'completed',
      } as any);

      const result = await savingsGoalsService.updateAmount(1, 1, updateDto);

      expect(savingsGoalsRepository.findOne).toHaveBeenCalled();
      expect(savingsGoalsRepository.save).toHaveBeenCalled();
      expect(result.current_amount).toBe(updateDto.current_amount);
      expect(result.status).toBe('completed');
    });

    it('should update current amount and mark as failed when deadline passed', async () => {
      const updateDto: UpdateSavingsGoalAmountDto = {
        current_amount: 3000,
      };

      const mockGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 2000,
        end_date: new Date('2022-12-31'), // Past date
        status: 'in_progress',
      };

      savingsGoalsRepository.findOne.mockResolvedValue(mockGoal as any);
      savingsGoalsRepository.save.mockResolvedValue({
        ...mockGoal,
        ...updateDto,
        status: 'failed',
      } as any);

      const result = await savingsGoalsService.updateAmount(1, 1, updateDto);

      expect(result.status).toBe('failed');
    });

    it('should keep status as in_progress when target not reached and deadline not passed', async () => {
      const updateDto: UpdateSavingsGoalAmountDto = {
        current_amount: 3000,
      };

      const mockGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 2000,
        end_date: new Date('2023-12-31'),
        status: 'in_progress',
      };

      savingsGoalsRepository.findOne.mockResolvedValue(mockGoal as any);
      savingsGoalsRepository.save.mockResolvedValue({
        ...mockGoal,
        ...updateDto,
        status: 'in_progress',
      } as any);

      const result = await savingsGoalsService.updateAmount(1, 1, updateDto);

      expect(result.status).toBe('in_progress');
    });
  });

  describe('getProgress', () => {
    it('should return progress information for a savings goal', async () => {
      const mockGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 2500,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'in_progress',
      };

      savingsGoalsRepository.findOne.mockResolvedValue(mockGoal as any);

      const result = await savingsGoalsService.getProgress(1, 1);

      expect(savingsGoalsRepository.findOne).toHaveBeenCalled();
      expect(result.id).toBe(mockGoal.id);
      expect(result.name).toBe(mockGoal.name);
      expect(result.target_amount).toBe(5000);
      expect(result.current_amount).toBe(2500);
      expect(result.progress_percentage).toBe(50);
      expect(result.days_left).toBe(30);
      expect(result.status).toBe('in_progress');
    });

    it('should return 0 days left when deadline passed', async () => {
      const mockGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 2500,
        end_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        status: 'failed',
      };

      savingsGoalsRepository.findOne.mockResolvedValue(mockGoal as any);

      const result = await savingsGoalsService.getProgress(1, 1);

      expect(result.days_left).toBe(0);
    });

    it('should return 0% progress when target amount is 0', async () => {
      const mockGoal = {
        id: 1,
        user_id: 1,
        name: 'Free Goal',
        target_amount: 0,
        current_amount: 1000,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
      };

      savingsGoalsRepository.findOne.mockResolvedValue(mockGoal as any);

      const result = await savingsGoalsService.getProgress(1, 1);

      expect(result.progress_percentage).toBe(0);
    });
  });
});
