import { loggerMiddleware } from '../../src/middleware/logger.middleware';
import logger from '../../src/utils/logger';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
}));

describe('loggerMiddleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset mock calls
    (logger.info as jest.Mock).mockClear();

    // Mock request object
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test',
      headers: {
        'user-agent': 'test-agent',
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: { test: 'data' },
      query: { param: 'value' },
      params: { id: '123' },
      ip: '127.0.0.1',
    };

    // Mock response object with event emitter
    mockRes = {
      statusCode: 200,
      statusMessage: 'OK',
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          // Save callback to call later
          (mockRes as any).finishCallback = callback;
        }
        return mockRes;
      }),
    };

    // Mock next function
    mockNext = jest.fn();
  });

  it('should log request information', () => {
    loggerMiddleware(mockReq, mockRes, mockNext);

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
      message: 'API Request Received',
      request: expect.objectContaining({
        method: mockReq.method,
        url: mockReq.originalUrl,
        headers: expect.objectContaining({
          'user-agent': mockReq.headers['user-agent'],
          'content-type': mockReq.headers['content-type'],
          authorization: '***',
        }),
        body: mockReq.body,
        query: mockReq.query,
        params: mockReq.params,
        ip: mockReq.ip,
      }),
    }));

    expect(mockNext).toHaveBeenCalled();
  });

  it('should log response information when response finishes', () => {
    loggerMiddleware(mockReq, mockRes, mockNext);

    // Clear the first info call (request log)
    (logger.info as jest.Mock).mockClear();

    // Simulate response finish event
    if ((mockRes as any).finishCallback) {
      (mockRes as any).finishCallback();
    }

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
      message: 'API Response Sent',
      request: expect.objectContaining({
        method: mockReq.method,
        url: mockReq.originalUrl,
      }),
      response: expect.objectContaining({
        statusCode: mockRes.statusCode,
        statusMessage: mockRes.statusMessage,
        responseTime: expect.stringMatching(/\d+ms/),
      }),
    }));
  });

  it('should handle requests without authorization header', () => {
    // Remove authorization header
    delete mockReq.headers.authorization;

    loggerMiddleware(mockReq, mockRes, mockNext);

    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
      request: expect.objectContaining({
        headers: expect.objectContaining({
          authorization: undefined,
        }),
      }),
    }));
  });

  it('should call next function', () => {
    loggerMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should log different HTTP methods', () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

    for (const method of methods) {
      // Reset mock calls for each iteration
      (logger.info as jest.Mock).mockClear();
      mockNext.mockClear();

      // Set current method
      mockReq.method = method;

      loggerMiddleware(mockReq, mockRes, mockNext);

      expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
        request: expect.objectContaining({
          method,
        }),
      }));

      expect(mockNext).toHaveBeenCalled();
    }
  });
});
