import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

// Mock the AuthService
jest.mock('../../src/auth/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue({
      access_token: 'jwt_token',
      user: {
        id: 1,
        username: 'testuser',
        created_at: new Date(),
      },
    }),
    register: jest.fn(),
  })),
}));

// Mock the UsersService
jest.mock('../../src/users/users.service', () => ({
  UsersService: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue({ access_token: 'jwt_token' }),
    findByUsername: jest.fn().mockResolvedValue({
      id: 1,
      username: 'testuser',
      password: 'hashed_password',
      created_at: new Date(),
    }),
    register: jest.fn(),
    validateUser: jest.fn(),
  })),
}));

// Mock the JwtService
jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    sign: jest.fn().mockReturnValue('jwt_token'),
  })),
}));

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, UsersService, JwtService],
    })
      // Override ThrottlerGuard with a mock implementation
      .overrideGuard(ThrottlerGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          // Mock implementation that always returns true
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 OK status code when login is successful', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect('Content-Type', /json/);

      // Verify the status code is 200 OK (not 201 Created)
      expect(response.status).toBe(200);
      
      // Verify the response body contains access_token and user info
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username');
    });
  });
});
