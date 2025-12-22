import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { Repository } from 'typeorm';
import { User } from '../../src/users/users.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import {
  RegisterUserDto,
  LoginUserDto,
  UpdateUserDto,
} from '../../src/users/users.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: MockType<Repository<User>>;
  let jwtService: MockType<JwtService>;

  // Mock types
  type MockType<T> = {
    [P in keyof T]?: jest.Mock<any>;
  };

  // Mock factory
  const mockRepository = jest.fn(() => ({
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((user) => Promise.resolve({ id: 1, ...user })),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  }));

  const mockJwtService = jest.fn(() => ({
    sign: jest.fn().mockReturnValue('jwt_token'),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepository,
        },
        {
          provide: JwtService,
          useFactory: mockJwtService,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user with hashed password', async () => {
      const registerDto: RegisterUserDto = {
        username: 'testuser',
        password: 'password123',
      };

      const result = await usersService.register(registerDto);

      // 验证bcrypt使用了10轮盐值
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: registerDto.username,
          password: 'hashed_password',
        }),
      );
      expect(usersRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.username).toBe(registerDto.username);
    });
  });

  describe('login', () => {
    it('should return a JWT token for valid credentials', async () => {
      const loginDto: LoginUserDto = {
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      usersRepository.findOne?.mockResolvedValue(mockUser);

      const result = await usersService.login(loginDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: loginDto.username },
      });
      // 验证bcrypt.compare直接使用客户端密码进行比较
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser.id,
      });
      expect(result).toEqual({ access_token: 'jwt_token' });
    });

    it('should throw UnauthorizedException for invalid username', async () => {
      const loginDto: LoginUserDto = {
        username: 'invaliduser',
        password: 'password123',
      };

      usersRepository.findOne?.mockResolvedValue(null);

      await expect(usersService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(usersService.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto: LoginUserDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      usersRepository.findOne?.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(usersService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(usersService.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('findByUsername', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      usersRepository.findOne?.mockResolvedValue(mockUser);

      const result = await usersService.findByUsername('testuser');

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user not found', async () => {
      usersRepository.findOne?.mockResolvedValue(null);

      const result = await usersService.findByUsername('invaliduser');

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'invaliduser' },
      });
      expect(result).toBeUndefined();
    });
  });

  describe('validateUser', () => {
    it('should return a user for valid credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      usersRepository.findOne?.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await usersService.validateUser('testuser', 'password123');

      expect(usersRepository.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid user', async () => {
      usersRepository.findOne?.mockResolvedValue(null);

      const result = await usersService.validateUser(
        'invaliduser',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      usersRepository.findOne?.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await usersService.validateUser(
        'testuser',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', password: 'hashed1' },
        { id: 2, username: 'user2', password: 'hashed2' },
      ];

      usersRepository.find?.mockResolvedValue(mockUsers);

      const result = await usersService.findAll();

      expect(usersRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
      expect(result.length).toBe(2);
    });

    it('should return an empty array if no users found', async () => {
      usersRepository.find?.mockResolvedValue([]);

      const result = await usersService.findAll();

      expect(usersRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      usersRepository.findOne?.mockResolvedValue(mockUser);

      const result = await usersService.findOne(1);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOne?.mockResolvedValue(null);

      await expect(usersService.findOne(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.findOne(999)).rejects.toThrow(
        'User with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a user with new data', async () => {
      const updateDto: UpdateUserDto = {
        username: 'updateduser',
        password: 'newpassword123',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      usersRepository.findOne?.mockResolvedValue(mockUser as any);
      usersRepository.save?.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      } as any);

      const result = await usersService.update(1, updateDto);

      expect(usersRepository.findOne).toHaveBeenCalled();
      expect(usersRepository.save).toHaveBeenCalled();
      expect(result.username).toBe(updateDto.username);
    });

    it('should hash password when updating password', async () => {
      const updateDto: UpdateUserDto = {
        password: 'newpassword123',
        username: 'updateduser',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'old_hashed_password',
      };

      usersRepository.findOne?.mockResolvedValue(mockUser as any);
      usersRepository.save?.mockResolvedValue({
        ...mockUser,
        username: 'updateduser',
        password: 'hashed_password',
      } as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await usersService.update(1, updateDto);

      // 验证使用了10轮bcrypt加密
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(result.password).toBe('hashed_password');
      expect(result.username).toBe('updateduser');
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOne?.mockResolvedValue(null);

      await expect(
        usersService.update(999, {
          username: 'updateduser',
          password: 'newpassword123',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      usersRepository.delete?.mockResolvedValue({ affected: 1 });

      await usersService.remove(1);

      expect(usersRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.delete?.mockResolvedValue({ affected: 0 });

      await expect(usersService.remove(999)).rejects.toThrow(NotFoundException);
      await expect(usersService.remove(999)).rejects.toThrow(
        'User with ID 999 not found',
      );
    });
  });
});
