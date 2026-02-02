import { DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 自动扫描所有模块
 */
function scanModules(): any[] {
  const modules: any[] = [];
  const srcPath = path.join(process.cwd(), 'src');

  // 递归扫描所有模块文件
  function scanDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDir(filePath);
      } else if (file.endsWith('.module.ts')) {
        // 动态导入模块
        const modulePath = filePath
          .replace(process.cwd(), '')
          .replace(/\\/g, '/')
          .replace('/src/', './src/')
          .replace('.ts', '');
        try {
          const module = require(modulePath);
          // 找到模块导出的默认类
          for (const key in module) {
            if (key.endsWith('Module')) {
              modules.push(module[key]);
              break;
            }
          }
        } catch (error) {
          console.error(`Failed to load module ${modulePath}:`, error);
        }
      }
    }
  }

  scanDir(srcPath);
  return modules;
}

/**
 * Swagger文档配置
 */
export const swaggerConfig = new DocumentBuilder()
  .setTitle('small-ledger API')
  .setDescription('家有小账本服务端API文档')
  .setVersion('1.0')
  .addBearerAuth() // 添加JWT认证支持
  .build();

/**
 * Swagger文档生成配置
 */
export const swaggerDocumentOptions = {
  operationIdFactory: (controllerKey: string, methodKey: string) =>
    `${controllerKey}_${methodKey}`,
  include: scanModules(), // 自动扫描所有模块
};
