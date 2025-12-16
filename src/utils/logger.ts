import winston from 'winston';
import 'winston-daily-rotate-file';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.DailyRotateFile({
      level: 'info',
      dirname: 'log2',
      filename: `${process.env.NODE_ENV}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD-HH-mm',
      maxSize: '1k',
    }),
  ],
});

export default logger;
