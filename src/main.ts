import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { updateGlobalConfig } from 'nestjs-paginate';
import { AppModule } from './app.module';
import { loggerMiddleware } from './middleware/logger.middleware';
import logger from './utils/logger';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from './utils/http-exception.filter';
import { swaggerConfig, swaggerDocumentOptions } from './config/swagger.config';
import { SwaggerGenerator } from './utils/swagger.generator';

async function bootstrap() {
  // 设置分页插件的全局默认配置
  updateGlobalConfig({
    defaultLimit: 10,
    defaultMaxLimit: 100,
  });

  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  // 启用CORS
  app.enableCors();

  // 使用日志中间件
  app.use(loggerMiddleware);

  // 使用验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动删除未定义的属性
      transform: true,
      disableErrorMessages: false,
    }),
  );

  // 全局开启 class-transformer 自动序列化
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // 使用全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 使用全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 配置Swagger文档
  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
    swaggerDocumentOptions,
  );
  SwaggerModule.setup('api-docs', app, document);

  // 生成并保存Swagger文档
  await SwaggerGenerator.generate(app);

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
