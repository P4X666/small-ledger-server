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

// Mock factory
const mockRepository = jest.fn(() => ({
  create: jest.fn().mockImplementation((dto: any) => dto),
  save: jest
    .fn()
    .mockImplementation((task: any) => Promise.resolve({ id: 1, ...task })),
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
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
        time_period: 'week',
        priority: 'high',
        status: 'pending',
        // deadline: new Date(),
        // quadrant: 1,
      };

      const result = await tasksService.create(1, createDto);

      expect(tasksRepository.create).toHaveBeenCalledWith({
        ...createDto,
        user_id: 1,
      });
      expect(tasksRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.user_id).toBe(1);
    });
  });

  describe('findAllByUserId', () => {
    it('should return all tasks for a user', async () => {
      const mockTasks = [
        { id: 1, user_id: 1, title: 'Task 1', status: 'pending' },
        { id: 2, user_id: 1, title: 'Task 2', status: 'completed' },
      ];

      tasksRepository.find.mockResolvedValue(mockTasks as any);

      const result = await tasksService.findAllByUserId(1);

      expect(tasksRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
      });
      expect(result).toEqual(mockTasks);
    });

    it('should return an empty array if no tasks found', async () => {
      tasksRepository.find.mockResolvedValue([]);

      const result = await tasksService.findAllByUserId(1);

      expect(result).toEqual([]);
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
        tasksService.update(999, 1, { title: 'Updated Task' }),
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
        status: 'completed',
      };

      const mockTask = {
        id: 1,
        user_id: 1,
        title: 'Test Task',
        status: 'pending',
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
        tasksService.updateStatus(999, 1, { status: 'completed' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTimePeriod', () => {
    it('should return tasks by time period', async () => {
      const mockTasks = [
        { id: 1, user_id: 1, title: 'Weekly Task', time_period: 'week' },
        {
          id: 2,
          user_id: 1,
          title: 'Another Weekly Task',
          time_period: 'week',
        },
      ];

      tasksRepository.find.mockResolvedValue(mockTasks as any);

      const result = await tasksService.findByTimePeriod(1, 'week');

      expect(tasksRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1, time_period: 'week' },
      });
      expect(result).toEqual(mockTasks);
    });

    it('should return tasks for different time periods', async () => {
      const mockTasks = [
        { id: 1, user_id: 1, title: 'Monthly Task', time_period: 'month' },
      ];

      tasksRepository.find.mockResolvedValue(mockTasks as any);

      const result = await tasksService.findByTimePeriod(1, 'month');

      expect(tasksRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1, time_period: 'month' },
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('findByQuadrant', () => {
    it('should return all tasks for a user when finding by quadrant', async () => {
      const mockTasks = [
        { id: 1, user_id: 1, title: 'Task 1', quadrant: 1 },
        { id: 2, user_id: 1, title: 'Task 2', quadrant: 2 },
      ];

      tasksRepository.find.mockResolvedValue(mockTasks as any);

      const result = await tasksService.findByQuadrant(1);

      expect(tasksRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
      });
      expect(result).toEqual(mockTasks);
    });
  });
});
