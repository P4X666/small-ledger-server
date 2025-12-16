import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from './app.module';
import { loggerMiddleware } from './middleware/logger.middleware';
import logger from './utils/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用CORS
  app.enableCors();

  // 使用日志中间件
  app.use(loggerMiddleware);

  // 使用验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 配置Swagger文档
  const config = new DocumentBuilder()
    .setTitle('small-ledger API')
    .setDescription('家有小账本服务端API文档')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 生成并保存Swagger JSON文档
  writeFileSync('./swagger-spec.json', JSON.stringify(document));

  // 生成并保存Swagger YAML文档
  // const yamlDocument = SwaggerModule.createDocument(app, config);
  // const yaml = require('js-yaml').dump(yamlDocument);
  // writeFileSync('./swagger-spec.yaml', yaml);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap().catch((error) => {
  logger.error('Failed to start the application:', error);
  process.exit(1);
});
