import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  // 记录请求开始时间
  const startTime = Date.now();
  
  // 获取请求信息
  const { method, originalUrl, headers, body, query, params } = req;
  
  // 记录请求日志
  logger.info({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'API Request Received',
    request: {
      method,
      url: originalUrl,
      headers: {
        'user-agent': headers['user-agent'],
        'content-type': headers['content-type'],
        authorization: headers.authorization ? '***' : undefined,
      },
      body,
      query,
      params,
      ip: req.ip,
    },
  });
  
  // 监听响应结束事件
  res.on('finish', () => {
    // 计算响应时间
    const responseTime = Date.now() - startTime;
    
    // 获取响应信息
    const { statusCode, statusMessage } = res;
    
    // 记录响应日志
    logger.info({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'API Response Sent',
      request: {
        method,
        url: originalUrl,
      },
      response: {
        statusCode,
        statusMessage,
        responseTime: `${responseTime}ms`,
      },
    });
  });
  
  next();
}
