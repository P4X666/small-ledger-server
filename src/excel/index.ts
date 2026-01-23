// 导出接口
import {
  ExcelParser,
  ExcelParserOptions,
  ExcelParseResult,
  ExcelValidator,
} from './excel.interface';

// 导出解析器
import { XlsxParser } from '../utils/excel/xlsx.parser';
import { CsvParser } from '../utils/excel/csv.parser';

// 导出服务
import { ExcelService } from './excel.service';

// 导出控制器
import { ExcelController } from './excel.controller';

// 导出模块
import { ExcelModule } from './excel.module';

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

  // 模块
  ExcelModule,
};
