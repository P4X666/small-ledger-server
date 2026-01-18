import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from '../../src/tasks/tasks.service';
import { Task } from '../../src/tasks/tasks.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from '../../src/tasks/tasks.dto';
import { NotFoundException } from '@nestjs/common';
import { TaskPriority, TaskStatus, TaskTimePeriod } from '../../src/enum';

// Mock factory
const mockRepository = jest.fn(() => ({
  create: jest.fn().mockImplementation((dto: any) => dto),
  save: jest
    .fn()
    .mockImplementation((task: any) => Promise.resolve({ id: 1, ...task })),
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
}));

type MockRepository = ReturnType<typeof mockRepository>;

describe('TasksService', () => {
  let tasksService: TasksService;
  let tasksRepository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    tasksRepository = module.get(getRepositoryToken(Task));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task for a user', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        timePeriod: TaskTimePeriod.Week,
        // priority: TaskPriority.High,
        // status: TaskStatus.Pending,
        importance: 3,
        urgency: 3,
        // deadline: new Date(),
        // quadrant: 1,
      };

      const result = await tasksService.create(1, createDto);

      const { timePeriod, ...restCreateDto } = createDto;

      expect(tasksRepository.create).toHaveBeenCalledWith({
        ...restCreateDto,
        priority: TaskPriority.Low,
        status: TaskStatus.InProgress,
        user_id: 1,
        time_period: timePeriod,
      });
      expect(tasksRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.user_id).toBe(1);
    });

    it('should correctly handle timePeriod field with month value', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task with Month',
        description: 'Test Description',
        timePeriod: TaskTimePeriod.Month,
        importance: 4,
        urgency: 4,
      };

      const result = await tasksService.create(1, createDto);

      const { timePeriod, ...restCreateDto } = createDto;

      expect(tasksRepository.create).toHaveBeenCalledWith({
        ...restCreateDto,
        priority: TaskPriority.High,
        status: TaskStatus.InProgress,
        user_id: 1,
        time_period: TaskTimePeriod.Month,
      });
      expect(tasksRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.time_period).toBe(TaskTimePeriod.Month);
    });
  });

  describe('getTasksQueryBuilder', () => {
    it('should return a query builder instance for user tasks', () => {
      const result = tasksService.getTasksQueryBuilder(1);

      expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should include timePeriod filter when provided', () => {
      // 模拟查询构建器的方法链
      const mockWhere = jest.fn().mockReturnThis();
      const mockAndWhere = jest.fn().mockReturnThis();
      const mockAddOrderBy = jest.fn().mockReturnThis();
      const mockSetParameters = jest.fn().mockReturnThis();

      (tasksRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        where: mockWhere,
        andWhere: mockAndWhere,
        addOrderBy: mockAddOrderBy,
        setParameters: mockSetParameters,
      });

      const result = tasksService.getTasksQueryBuilder(1, TaskTimePeriod.Month);

      expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockWhere).toHaveBeenCalledWith(
        'task.user_id = :user_id AND task.isDeleted = false',
        { user_id: 1 },
      );
      expect(mockAndWhere).toHaveBeenCalledWith(
        'task.time_period = :timePeriod',
        { timePeriod: TaskTimePeriod.Month },
      );
      expect(mockSetParameters).toHaveBeenCalledWith({
        statusInProgress: TaskStatus.InProgress,
        importance4: 4,
        urgency4: 4,
        importance3: 3,
        urgency3: 3,
        timePeriod: TaskTimePeriod.Month,
      });
      expect(result).toBeDefined();
    });

    it('should not include timePeriod filter when not provided', () => {
      // 模拟查询构建器的方法链
      const mockWhere = jest.fn().mockReturnThis();
      const mockAddOrderBy = jest.fn().mockReturnThis();
      const mockSetParameters = jest.fn().mockReturnThis();

      (tasksRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        where: mockWhere,
        andWhere: jest.fn(), // 这个方法不应该被调用
        addOrderBy: mockAddOrderBy,
        setParameters: mockSetParameters,
      });

      const result = tasksService.getTasksQueryBuilder(1);

      expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockWhere).toHaveBeenCalledWith(
        'task.user_id = :user_id AND task.isDeleted = false',
        { user_id: 1 },
      );
      expect(mockSetParameters).toHaveBeenCalledWith({
        statusInProgress: TaskStatus.InProgress,
        importance4: 4,
        urgency4: 4,
        importance3: 3,
        urgency3: 3,
      });
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a task by id for a user', async () => {
      const mockTask = {
        id: 1,
        user_id: 1,
        title: 'Test Task',
        status: 'pending',
      };

      tasksRepository.findOne.mockResolvedValue(mockTask as any);

      const result = await tasksService.findOne(1, 1);

      expect(tasksRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      tasksRepository.findOne.mockResolvedValue(null);

      await expect(tasksService.findOne(999, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(tasksService.findOne(999, 1)).rejects.toThrow(
        'Task with ID 999 not found',
      );
    });

    it('should throw NotFoundException if task belongs to another user', async () => {
      tasksRepository.findOne.mockResolvedValue(null);

      await expect(tasksService.findOne(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task for a user', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        timePeriod: TaskTimePeriod.Week,
        priority: TaskPriority.High,
        status: TaskStatus.Pending,
        importance: 3,
        urgency: 3,
      };

      const mockTask = {
        id: 1,
        user_id: 1,
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
      };

      tasksRepository.findOne.mockResolvedValue(mockTask as any);
      const { timePeriod, ...restUpdateDto } = updateDto;

      tasksRepository.save.mockResolvedValue({
        ...mockTask,
        ...restUpdateDto,
        time_period: timePeriod,
      } as any);

      const result = await tasksService.update(1, 1, updateDto);

      expect(tasksRepository.findOne).toHaveBeenCalled();
      expect(tasksRepository.save).toHaveBeenCalled();
      expect(result.title).toBe(updateDto.title);
      expect(result.description).toBe(updateDto.description);
    });

    it('should throw NotFoundException if task not found', async () => {
      tasksRepository.findOne.mockResolvedValue(null);

      await expect(
        tasksService.update(999, 1, {
          title: 'Updated Task',
          description: 'Updated Description',
          timePeriod: TaskTimePeriod.Week,
          priority: TaskPriority.High,
          status: TaskStatus.Pending,
          importance: 3,
          urgency: 3,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should mark a task as deleted for a user', async () => {
      const mockTask = {
        id: 1,
        user_id: 1,
        title: 'Test Task',
        isDeleted: false,
      };

      tasksRepository.findOne.mockResolvedValue(mockTask as any);
      tasksRepository.save.mockResolvedValue({ ...mockTask, isDeleted: true });

      await tasksService.remove(1, 1);

      expect(tasksRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
      });
      expect(tasksRepository.save).toHaveBeenCalledWith({
        ...mockTask,
        isDeleted: true,
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      tasksRepository.findOne.mockResolvedValue(null);

      await expect(tasksService.remove(999, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(tasksService.remove(999, 1)).rejects.toThrow(
        'Task with ID 999 not found',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update the status of a task', async () => {
      const statusDto: UpdateTaskStatusDto = {
        status: TaskStatus.Completed,
      };

      const mockTask = {
        id: 1,
        user_id: 1,
        title: 'Test Task',
        status: TaskStatus.Pending,
      };

      tasksRepository.findOne.mockResolvedValue(mockTask as any);
      tasksRepository.save.mockResolvedValue({
        ...mockTask,
        ...statusDto,
      } as any);

      const result = await tasksService.updateStatus(1, 1, statusDto);

      expect(tasksRepository.findOne).toHaveBeenCalled();
      expect(tasksRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(statusDto.status);
    });

    it('should throw NotFoundException if task not found', async () => {
      tasksRepository.findOne.mockResolvedValue(null);

      await expect(
        tasksService.updateStatus(999, 1, { status: TaskStatus.Completed }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTimePeriod', () => {
    it('should return tasks by time period', async () => {
      const mockTasks = [
        {
          id: 1,
          user_id: 1,
          title: 'Weekly Task',
          time_period: TaskTimePeriod.Week,
        },
        {
          id: 2,
          user_id: 1,
          title: 'Another Weekly Task',
          time_period: TaskTimePeriod.Week,
        },
      ];

      tasksRepository.find.mockResolvedValue(mockTasks as any);

      const result = await tasksService.findByTimePeriod(
        1,
        TaskTimePeriod.Week,
      );

      expect(tasksRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          time_period: TaskTimePeriod.Week,
          isDeleted: false,
        },
      });
      expect(result).toEqual(mockTasks);
    });

    it('should return tasks for different time periods', async () => {
      const mockTasks = [
        { id: 1, user_id: 1, title: 'Monthly Task', time_period: 'month' },
      ];

      tasksRepository.find.mockResolvedValue(mockTasks as any);

      const result = await tasksService.findByTimePeriod(
        1,
        TaskTimePeriod.Month,
      );

      expect(tasksRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          time_period: TaskTimePeriod.Month,
          isDeleted: false,
        },
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('findByQuadrant', () => {
    it('should return tasks grouped by quadrant for a user', async () => {
      const mockTasks = [
        { id: 1, user_id: 1, title: 'Task 1', importance: 4, urgency: 4 },
        { id: 2, user_id: 1, title: 'Task 2', importance: 4, urgency: 3 },
        { id: 3, user_id: 1, title: 'Task 3', importance: 3, urgency: 4 },
        { id: 4, user_id: 1, title: 'Task 4', importance: 3, urgency: 3 },
      ];

      tasksRepository.find.mockResolvedValue(mockTasks as any);

      const result = await tasksService.findByQuadrant(1);

      expect(tasksRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1, isDeleted: false },
      });
      expect(result).toEqual({
        first: [mockTasks[0]],
        second: [mockTasks[1]],
        third: [mockTasks[2]],
        fourth: [mockTasks[3]],
      });
    });
  });

  describe('getTasksStatistics', () => {
    it('should return correct task statistics for a user', async () => {
      // Mock count method to return different values for different queries
      const mockCount = jest
        .fn()
        .mockResolvedValueOnce(10) // allTasksTotal
        .mockResolvedValueOnce(5) // inProgressTasksTotal
        .mockResolvedValueOnce(2); // highPriorityTasksTotal

      // Override the count method
      tasksRepository.count = mockCount;

      const result = await tasksService.getTasksStatistics(1);

      expect(mockCount).toHaveBeenCalledTimes(3);
      // Verify all tasks count call
      expect(mockCount).toHaveBeenNthCalledWith(1, {
        where: { user_id: 1, isDeleted: false },
      });
      // Verify in progress tasks count call
      expect(mockCount).toHaveBeenNthCalledWith(2, {
        where: { user_id: 1, status: TaskStatus.InProgress, isDeleted: false },
      });
      // Verify high priority tasks count call
      expect(mockCount).toHaveBeenNthCalledWith(3, {
        where: { user_id: 1, importance: 4, urgency: 4, isDeleted: false },
      });

      expect(result).toEqual({
        allTasksTotal: 10,
        inProgressTasksTotal: 5,
        highPriorityTasksTotal: 2,
      });
    });

    it('should return zero values when no tasks exist', async () => {
      // Mock count method to return 0 for all queries
      const mockCount = jest.fn().mockResolvedValue(0);
      tasksRepository.count = mockCount;

      const result = await tasksService.getTasksStatistics(1);

      expect(mockCount).toHaveBeenCalledTimes(3);
      // Verify all calls include isDeleted: false
      expect(mockCount).toHaveBeenNthCalledWith(1, {
        where: { user_id: 1, isDeleted: false },
      });
      expect(mockCount).toHaveBeenNthCalledWith(2, {
        where: { user_id: 1, status: TaskStatus.InProgress, isDeleted: false },
      });
      expect(mockCount).toHaveBeenNthCalledWith(3, {
        where: { user_id: 1, importance: 4, urgency: 4, isDeleted: false },
      });
      expect(result).toEqual({
        allTasksTotal: 0,
        inProgressTasksTotal: 0,
        highPriorityTasksTotal: 0,
      });
    });

    it('should return correct statistics for different user', async () => {
      // Mock count method to return different values
      const mockCount = jest
        .fn()
        .mockResolvedValueOnce(7) // allTasksTotal for user 2
        .mockResolvedValueOnce(3) // inProgressTasksTotal for user 2
        .mockResolvedValueOnce(1); // highPriorityTasksTotal for user 2

      tasksRepository.count = mockCount;

      const result = await tasksService.getTasksStatistics(2);

      // Verify all calls use user_id: 2 and include isDeleted: false
      expect(mockCount).toHaveBeenCalledTimes(3);
      expect(mockCount).toHaveBeenNthCalledWith(1, {
        where: { user_id: 2, isDeleted: false },
      });
      expect(mockCount).toHaveBeenNthCalledWith(2, {
        where: { user_id: 2, status: TaskStatus.InProgress, isDeleted: false },
      });
      expect(mockCount).toHaveBeenNthCalledWith(3, {
        where: { user_id: 2, importance: 4, urgency: 4, isDeleted: false },
      });

      expect(result).toEqual({
        allTasksTotal: 7,
        inProgressTasksTotal: 3,
        highPriorityTasksTotal: 1,
      });
    });
  });

  describe('getDeletedTasksQueryBuilder', () => {
    it('should return a query builder for deleted tasks without filters', () => {
      // Mock query builder methods
      const mockWhere = jest.fn().mockReturnThis();
      const mockAndWhere = jest.fn().mockReturnThis();

      (tasksRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        where: mockWhere,
        andWhere: mockAndWhere,
      });

      const result = tasksService.getDeletedTasksQueryBuilder(1);

      expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockWhere).toHaveBeenCalledWith(
        'task.user_id = :user_id AND task.isDeleted = true',
        { user_id: 1 },
      );
      expect(mockAndWhere).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return a query builder for deleted tasks with status filter', () => {
      // Mock query builder methods
      const mockWhere = jest.fn().mockReturnThis();
      const mockAndWhere = jest.fn().mockReturnThis();

      (tasksRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        where: mockWhere,
        andWhere: mockAndWhere,
      });

      const result = tasksService.getDeletedTasksQueryBuilder(
        1,
        TaskStatus.Completed,
      );

      expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockWhere).toHaveBeenCalledWith(
        'task.user_id = :user_id AND task.isDeleted = true',
        { user_id: 1 },
      );
      expect(mockAndWhere).toHaveBeenCalledWith('task.status = :status', {
        status: TaskStatus.Completed,
      });
      expect(result).toBeDefined();
    });

    it('should return a query builder for deleted tasks with timePeriod filter', () => {
      // Mock query builder methods
      const mockWhere = jest.fn().mockReturnThis();
      const mockAndWhere = jest.fn().mockReturnThis();

      (tasksRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        where: mockWhere,
        andWhere: mockAndWhere,
      });

      const result = tasksService.getDeletedTasksQueryBuilder(
        1,
        undefined,
        TaskTimePeriod.Month,
      );

      expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockWhere).toHaveBeenCalledWith(
        'task.user_id = :user_id AND task.isDeleted = true',
        { user_id: 1 },
      );
      expect(mockAndWhere).toHaveBeenCalledWith(
        'task.time_period = :timePeriod',
        { timePeriod: TaskTimePeriod.Month },
      );
      expect(result).toBeDefined();
    });

    it('should return a query builder for deleted tasks with both status and timePeriod filters', () => {
      // Mock query builder methods
      const mockWhere = jest.fn().mockReturnThis();
      const mockAndWhere = jest.fn().mockReturnThis();

      (tasksRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        where: mockWhere,
        andWhere: mockAndWhere,
      });

      const result = tasksService.getDeletedTasksQueryBuilder(
        1,
        TaskStatus.Completed,
        TaskTimePeriod.Month,
      );

      expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockWhere).toHaveBeenCalledWith(
        'task.user_id = :user_id AND task.isDeleted = true',
        { user_id: 1 },
      );
      expect(mockAndWhere).toHaveBeenNthCalledWith(1, 'task.status = :status', {
        status: TaskStatus.Completed,
      });
      expect(mockAndWhere).toHaveBeenNthCalledWith(
        2,
        'task.time_period = :timePeriod',
        { timePeriod: TaskTimePeriod.Month },
      );
      expect(result).toBeDefined();
    });
  });
});
