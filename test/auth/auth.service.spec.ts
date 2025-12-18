import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto, LoginUserDto } from '../../src/users/users.dto';
import { UnauthorizedException } from '@nestjs/common';

// Mock UsersService methods
jest.mock('../../src/users/users.service', () => {
  const mockFindByUsername = jest.fn();
  const mockRegister = jest.fn().mockResolvedValue({
    id: 1,
    username: 'testuser',
    password: 'hashed_password',
  });
  const mockLogin = jest.fn();
  const mockValidateUser = jest.fn();
  const mockFindOne = jest.fn();
  const mockSave = jest.fn();
  const mockDelete = jest.fn();
  const mockFindAll = jest.fn();
  
  return {
    UsersService: jest.fn().mockImplementation(() => ({
      register: mockRegister,
      login: mockLogin,
      validateUser: mockValidateUser,
      findByUsername: mockFindByUsername,
      findOne: mockFindOne,
      save: mockSave,
      delete: mockDelete,
      findAll: mockFindAll,
    })),
  };
});

jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    sign: jest.fn().mockReturnValue('jwt_token'),
  })),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UsersService, JwtService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(
      UsersService,
    ) as jest.Mocked<UsersService>;
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call usersService.register with the provided dto', async () => {
      const registerDto: RegisterUserDto = {
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      usersService.register.mockResolvedValue(mockUser as any);

      const result = await authService.register(registerDto);

      expect(usersService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException when username or password is empty', async () => {
      // Set up mock to throw error when username or password is empty
      usersService.login.mockImplementation((loginDto: LoginUserDto) => {
        if (!loginDto.username || !loginDto.password) {
          throw new UnauthorizedException('Invalid credentials');
        }
        return Promise.resolve({ access_token: 'jwt_token' });
      });
      
      // Test with empty username
      await expect(authService.login({ username: '', password: 'password123' } as LoginUserDto)).rejects.toThrow(UnauthorizedException);
      
      // Test with empty password
      await expect(authService.login({ username: 'testuser', password: '' } as LoginUserDto)).rejects.toThrow(UnauthorizedException);
      
      // Test with both empty
      await expect(authService.login({ username: '', password: '' } as LoginUserDto)).rejects.toThrow(UnauthorizedException);
      
      // Test with undefined values
      await expect(authService.login({} as LoginUserDto)).rejects.toThrow(UnauthorizedException);
    });
    
    it('should call usersService.login with the provided dto when params are valid', async () => {
      const loginDto: LoginUserDto = {
        username: 'testuser',
        password: 'password123',
      };

      const mockToken = { access_token: 'jwt_token' };

      // Set up mock to return token when params are valid
      usersService.login.mockResolvedValue(mockToken);

      const result = await authService.login(loginDto);

      expect(usersService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockToken);
    });
  });

  describe('validateUser', () => {
    it('should call usersService.validateUser with the provided credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      usersService.validateUser.mockResolvedValue(mockUser as any);

      const result = await authService.validateUser('testuser', 'password123');

      expect(usersService.validateUser).toHaveBeenCalledWith(
        'testuser',
        'password123',
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid credentials', async () => {
      usersService.validateUser.mockResolvedValue(null);

      const result = await authService.validateUser(
        'invaliduser',
        'wrongpassword',
      );

      expect(usersService.validateUser).toHaveBeenCalledWith(
        'invaliduser',
        'wrongpassword',
      );
      expect(result).toBeNull();
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token for the provided user', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      const mockToken = 'jwt_token';

      jwtService.sign.mockReturnValue(mockToken);

      const result = authService.generateToken(mockUser as any);

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser.id,
      });
      expect(result).toEqual({ access_token: mockToken });
    });
  });
});
