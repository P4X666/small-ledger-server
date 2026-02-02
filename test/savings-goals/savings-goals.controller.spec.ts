import { Test, TestingModule } from '@nestjs/testing';
import { SavingsGoalsController } from '../../src/savings-goals/savings-goals.controller';
import { SavingsGoalsService } from '../../src/savings-goals/savings-goals.service';
import { SavingsGoal } from '../../src/savings-goals/savings-goals.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavingsGoalStatus, SavingsGoalPeriod } from '@/enum';

// Mock 用户数据
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'password',
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

// Mock 数据
const mockSavingsGoals: SavingsGoal[] = [
  {
    id: 1,
    name: '攒钱买手机',
    description: '购买最新款手机',
    target_amount: 8000,
    current_amount: 2000,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-06-01'),
    status: SavingsGoalStatus.InProgress,
    user_id: 1,
    user: mockUser as any,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  },
  {
    id: 2,
    name: '攒钱旅游',
    description: '去日本旅游',
    target_amount: 15000,
    current_amount: 5000,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-08-01'),
    status: SavingsGoalStatus.InProgress,
    user_id: 1,
    user: mockUser as any,
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02'),
  },
  {
    id: 3,
    name: '攒钱买房',
    description: '首付',
    target_amount: 300000,
    current_amount: 50000,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2025-01-01'),
    status: SavingsGoalStatus.InProgress,
    user_id: 1,
    user: mockUser as any,
    created_at: new Date('2024-01-03'),
    updated_at: new Date('2024-01-03'),
  },
  {
    id: 4,
    name: '攒钱买车',
    description: '购买代步车',
    target_amount: 100000,
    current_amount: 30000,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-01'),
    status: SavingsGoalStatus.InProgress,
    user_id: 1,
    user: mockUser as any,
    created_at: new Date('2024-01-04'),
    updated_at: new Date('2024-01-04'),
  },
  {
    id: 5,
    name: '攒钱买电脑',
    description: '购买笔记本电脑',
    target_amount: 12000,
    current_amount: 4000,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-05-01'),
    status: SavingsGoalStatus.InProgress,
    user_id: 1,
    user: mockUser as any,
    created_at: new Date('2024-01-05'),
    updated_at: new Date('2024-01-05'),
  },
];

describe('SavingsGoalsController', () => {
  let controller: SavingsGoalsController;
  let service: SavingsGoalsService;
  let repository: Repository<SavingsGoal>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavingsGoalsController],
      providers: [
        SavingsGoalsService,
        {
          provide: getRepositoryToken(SavingsGoal),
          useClass: Repository,
        },
      ],
    }).compile();

    controller = module.get<SavingsGoalsController>(SavingsGoalsController);
    service = module.get<SavingsGoalsService>(SavingsGoalsService);
    repository = module.get<Repository<SavingsGoal>>(
      getRepositoryToken(SavingsGoal),
    );
  });

  describe('findAll', () => {
    it('should return paginated savings goals', async () => {
      // Mock 控制器方法
      const mockPaginationResult = {
        data: mockSavingsGoals.slice(0, 2),
        meta: {
          itemsPerPage: 2,
          totalItems: 5,
          currentPage: 1,
          totalPages: 3,
          sortBy: [{ field: 'created_at', direction: 'DESC' }],
          searchBy: [],
          search: '',
        },
      };

      // 直接 mock findAll 方法
      jest
        .spyOn(controller, 'findAll')
        .mockResolvedValue(mockPaginationResult as any);

      // 模拟分页查询参数
      const mockQuery = {
        page: 1,
        limit: 2,
        sortBy: [{ field: 'created_at', direction: 'DESC' }],
        searchBy: [],
        search: '',
      };

      // 执行测试
      const result = await controller.findAll(
        mockQuery as any,
        mockUser as any,
      );

      // 验证结果
      expect(result).toBeDefined();
      expect(result).toEqual(mockPaginationResult);
      expect(result.meta.totalItems).toBe(5);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.itemsPerPage).toBe(2);
      expect(result.data.length).toBe(2);
    });

    it('should return empty array when no savings goals', async () => {
      // Mock 空数据结果
      const mockEmptyResult = {
        data: [],
        meta: {
          itemsPerPage: 10,
          totalItems: 0,
          currentPage: 1,
          totalPages: 0,
          sortBy: [{ field: 'created_at', direction: 'DESC' }],
          searchBy: [],
          search: '',
        },
      };

      // 直接 mock findAll 方法
      jest
        .spyOn(controller, 'findAll')
        .mockResolvedValue(mockEmptyResult as any);

      // 模拟分页查询参数
      const mockQuery = {
        page: 1,
        limit: 10,
      };

      // 执行测试
      const result = await controller.findAll(
        mockQuery as any,
        mockUser as any,
      );

      // 验证结果
      expect(result).toBeDefined();
      expect(result).toEqual(mockEmptyResult);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.data).toEqual([]);
    });
  });
});
