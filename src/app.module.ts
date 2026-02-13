import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SavingsGoalsModule } from './savings-goals/savings-goals.module';
import { AuthModule } from './auth/auth.module';
import { ExcelModule } from './excel/excel.module';
import dataSource from './config/database.config';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    }),
    // 配置静态文件服务
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src', 'statics'),
      serveRoot: '/statics',
      serveStaticOptions: {
        // 不返回目录索引
        index: false,
        // 缓存时间为0，不缓存
        maxAge: 0,
      },
    }),
    // 配置请求频率限制，防止暴力破解
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'auth',
          ttl: 60000, // 1分钟
          limit: 10, // 最多10个请求
        },
      ],
    }),
    TypeOrmModule.forRoot({
      ...dataSource.options,
      synchronize: process.env.DB_SYNC === 'true',
    }),
    UsersModule,
    AuthModule,
    TasksModule,
    TransactionsModule,
    SavingsGoalsModule,
    ExcelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
