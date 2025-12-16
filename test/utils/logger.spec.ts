// Mock winston
jest.mock('winston', () => {
  const mockCreateLogger = jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }));

  const mockTransports = {
    Console: jest.fn(),
    DailyRotateFile: jest.fn(),
  };

  return {
    createLogger: mockCreateLogger,
    transports: mockTransports,
    format: {
      simple: jest.fn().mockReturnValue('simple_format'),
    },
  };
});

jest.mock('winston-daily-rotate-file');

// Import logger after mocking
import logger from '../../src/utils/logger';

describe('Logger', () => {
  it('should export a logger instance with correct methods', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });
});
