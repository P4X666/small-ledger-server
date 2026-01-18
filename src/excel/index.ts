// 导出接口
import {
  ExcelParser,
  ExcelParserOptions,
  ExcelParseResult,
  ExcelValidator,
} from './excel.interface';

// 导出解析器
import { XlsxParser } from './xlsx.parser';
import { CsvParser } from './csv.parser';

// 导出服务
import { ExcelService } from './excel.service';

// 导出控制器
import { ExcelController } from './excel.controller';

// 导出验证器
import { ExampleValidator } from './validators/example.validator';

// 导出模块
import { ExcelModule } from './excel.module';

// 导出示例
import {
  runExamples,
  parseExcelFile,
  parseCsvFile,
  validateData,
  batchParseFiles,
} from './excel.example';

export {
  // 接口
  ExcelParser,
  type ExcelParserOptions,
  type ExcelParseResult,
  type ExcelValidator,

  // 解析器
  XlsxParser,
  CsvParser,

  // 服务
  ExcelService,

  // 控制器
  ExcelController,

  // 验证器
  ExampleValidator,

  // 模块
  ExcelModule,

  // 示例
  runExamples,
  parseExcelFile,
  parseCsvFile,
  validateData,
  batchParseFiles,
};
