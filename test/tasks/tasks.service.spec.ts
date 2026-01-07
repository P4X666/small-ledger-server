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

      expect(tasksRepository.create).toHaveBeenCalledWith({
        ...createDto,
        priority: TaskPriority.Low,
        status: TaskStatus.InProgress,
        user_id: 1,
      });
      expect(tasksRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.user_id).toBe(1);
    });
  });

  describe('getTasksQueryBuilder', () => {
    it('should return a query builder instance for user tasks', () => {
      const result = tasksService.getTasksQueryBuilder(1);

      expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
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
      tasksRepository.save.mockResolvedValue({
        ...mockTask,
        ...updateDto,
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
    it('should delete a task by id for a user', async () => {
      await tasksService.remove(1, 1);

      expect(tasksRepository.delete).toHaveBeenCalledWith({
        id: 1,
        user_id: 1,
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      tasksRepository.delete.mockResolvedValue({ affected: 0 });

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
        where: { user_id: 1, time_period: TaskTimePeriod.Week },
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
        where: { user_id: 1, time_period: TaskTimePeriod.Month },
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
        where: { user_id: 1 },
      });
      expect(result).toEqual({
        first: [mockTasks[0]],
        second: [mockTasks[1]],
        third: [mockTasks[2]],
        fourth: [mockTasks[3]],
      });
    });
  });
});
