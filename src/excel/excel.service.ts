import { extname } from 'path';
import {
  ExcelParser,
  ExcelParserOptions,
  ExcelParseResult,
  ExcelValidator,
} from './excel.interface';
import { XlsxParser } from './xlsx.parser';
import { CsvParser } from './csv.parser';
import { ZipParser } from './zip.parser';

export class ExcelService {
  private parsers: ExcelParser[] = [];

  constructor() {
    // 注册默认解析器
    this.registerParser(new XlsxParser());
    this.registerParser(new CsvParser());
    this.registerParser(new ZipParser());
  }

  /**
   * 注册解析器
   * @param parser 解析器实例
   */
  registerParser(parser: ExcelParser): void {
    this.parsers.push(parser);
  }

  /**
   * 解析Excel/CSV文件
   * @param filePath 文件路径
   * @param options 解析选项
   * @returns 解析结果
   */
  async parse(
    filePath: string,
    options: ExcelParserOptions = {},
  ): Promise<ExcelParseResult> {
    // 获取文件扩展名
    const extension = extname(filePath).toLowerCase();

    // 选择合适的解析器
    const parser = this.parsers.find((p) =>
      p.supportedExtensions.includes(extension),
    );

    if (!parser) {
      throw new Error(`不支持的文件类型: ${extension}`);
    }

    // 验证文件格式
    const isValid = await parser.validateFormat(filePath);
    if (!isValid) {
      // 清理路径，使用正斜杠显示
      const cleanPath = filePath.replace(/\\/g, '/');
      throw new Error(`文件格式无效: ${cleanPath}`);
    }

    // 解析文件
    return parser.parse(filePath, options);
  }

  /**
   * 验证文件格式
   * @param filePath 文件路径
   * @returns 是否有效
   */
  async validateFormat(filePath: string): Promise<boolean> {
    // 获取文件扩展名
    const extension = extname(filePath).toLowerCase();

    // 选择合适的解析器
    const parser = this.parsers.find((p) =>
      p.supportedExtensions.includes(extension),
    );

    if (!parser) {
      return false;
    }

    // 验证文件格式
    return parser.validateFormat(filePath);
  }

  /**
   * 使用验证器验证数据
   * @param data 解析后的数据
   * @param validator 验证器
   * @returns 验证结果
   */
  validateData(
    data: any[],
    validator: ExcelValidator,
  ): { valid: boolean; errors: string[] } {
    return validator.validate(data);
  }

  /**
   * 批量解析文件
   * @param filePaths 文件路径数组
   * @param options 解析选项
   * @returns 解析结果数组
   */
  async batchParse(
    filePaths: string[],
    options: ExcelParserOptions = {},
  ): Promise<ExcelParseResult[]> {
    const results: ExcelParseResult[] = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.parse(filePath, options);
        results.push(result);
      } catch (error) {
        console.error(`解析文件失败 ${filePath}:`, error.message);
        // 继续解析其他文件
      }
    }

    return results;
  }
}
