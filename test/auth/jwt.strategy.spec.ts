import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../../src/auth/jwt.strategy';
import { UsersService } from '../../src/users/users.service';
import { NotFoundException } from '@nestjs/common';

// Mock UsersService
jest.mock('../../src/users/users.service');

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        UsersService,
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user when valid payload is provided', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      const payload = { sub: 1, username: 'testuser' };

      usersService.findOne.mockResolvedValue(mockUser as any);

      const result = await jwtStrategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const payload = { sub: 999, username: 'nonexistentuser' };

      usersService.findOne.mockRejectedValue(new NotFoundException('User not found'));

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(NotFoundException);
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(jwtStrategy).toBeDefined();
    });

    it('should create an instance of JwtStrategy', () => {
      expect(jwtStrategy).toBeInstanceOf(JwtStrategy);
    });
  });
});
