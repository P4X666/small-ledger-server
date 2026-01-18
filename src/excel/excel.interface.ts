export interface ExcelParserOptions {
  /**
   * 是否跳过表头
   */
  skipHeader?: boolean;
  /**
   * 工作表名称（仅Excel文件适用）
   */
  sheetName?: string;
  /**
   * 编码（仅CSV文件适用）
   */
  encoding?: string;
  /**
   * 跳过的行数（从文件开头开始计算）
   */
  skipRows?: number;
  /**
   * 分批处理回调函数
   */
  batchCallback?: (data: any[]) => void;
}

export interface ExcelParseResult {
  /**
   * 解析后的数据
   */
  data: any[];
  /**
   * 文件类型
   */
  fileType: 'xlsx' | 'csv';
  /**
   * 总行数（包括表头）
   */
  totalRows: number;
  /**
   * 解析耗时（毫秒）
   */
  parseTime: number;
}

export interface ExcelValidator {
  /**
   * 验证数据
   * @param data 解析后的数据
   * @returns 验证结果
   */
  validate(data: any[]): {
    valid: boolean;
    errors: string[];
  };
}

export abstract class ExcelParser {
  /**
   * 支持的文件扩展名
   */
  abstract get supportedExtensions(): string[];

  /**
   * 解析文件
   * @param filePath 文件路径
   * @param options 解析选项
   * @returns 解析结果
   */
  abstract parse(
    filePath: string,
    options?: ExcelParserOptions,
  ): Promise<ExcelParseResult>;

  /**
   * 验证文件格式
   * @param filePath 文件路径
   * @returns 是否有效
   */
  abstract validateFormat(filePath: string): Promise<boolean>;
}
