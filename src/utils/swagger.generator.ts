import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import {
  swaggerConfig,
  swaggerDocumentOptions,
} from '../config/swagger.config';

/**
 * Swagger文档生成器
 */
export class SwaggerGenerator {
  /**
   * 生成并保存Swagger文档
   * @param app Nest应用实例
   */
  static async generate(app: INestApplication<any>): Promise<void> {
    // 生成Swagger文档
    const document = SwaggerModule.createDocument(
      app,
      swaggerConfig,
      swaggerDocumentOptions,
    );

    // 保存JSON格式文档
    const jsonPath = path.join(process.cwd(), 'swagger-spec.json');
    fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2));
    console.log(`Swagger JSON文档已保存到: ${jsonPath}`);

    // 可以选择保存YAML格式文档
    // const yamlPath = path.join(process.cwd(), 'swagger-spec.yaml');
    // const yaml = require('js-yaml').dump(document);
    // fs.writeFileSync(yamlPath, yaml);
    // console.log(`Swagger YAML文档已保存到: ${yamlPath}`);
  }
}
