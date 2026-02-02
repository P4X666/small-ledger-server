require('tsconfig-paths/register');
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SwaggerGenerator } from '../utils/swagger.generator';

async function generateSwagger() {
  console.log('开始生成Swagger文档...');

  const app = await NestFactory.create(AppModule);

  try {
    await SwaggerGenerator.generate(app);
    console.log('Swagger文档生成成功！');
  } catch (error) {
    console.error('Swagger文档生成失败:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

generateSwagger();
