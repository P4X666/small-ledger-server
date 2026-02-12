import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';

// 加载环境变量
ConfigModule.forRoot({
  envFilePath: `.env.${process.env.NODE_ENV}`,
  isGlobal: true,
});

// 创建并导出数据源
export default new DataSource({
  type: process.env.DB_TYPE as 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  charset: 'utf8mb4',
  timezone: '+08:00',
  logging: ['query', 'error'],
  extra: {
    decimalNumbers: true,
  },
});
