import { ExcelParser } from './excel.interface';
import { CsvParser } from './csv.parser';
import { XlsxParser } from './xlsx.parser';

export class ExcelParserFactory {
  private static parsers: Map<string, ExcelParser> = new Map();

  // 静态初始化解析器
  static {
    const csvParser = new CsvParser();
    const xlsxParser = new XlsxParser();

    // 注册CSV解析器
    csvParser.supportedExtensions.forEach((ext) => {
      ExcelParserFactory.parsers.set(ext.toLowerCase(), csvParser);
    });

    // 注册XLSX解析器
    xlsxParser.supportedExtensions.forEach((ext) => {
      ExcelParserFactory.parsers.set(ext.toLowerCase(), xlsxParser);
    });
  }

  /**
   * 根据文件扩展名获取对应的解析器
   * @param filePath 文件路径
   * @returns 对应的Excel解析器
   */
  static getParser(filePath: string): ExcelParser {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    const parser = this.parsers.get(ext);

    if (!parser) {
      throw new Error(`不支持的文件格式: ${ext}`);
    }

    return parser;
  }

  /**
   * 获取所有支持的文件扩展名
   * @returns 支持的文件扩展名数组
   */
  static getSupportedExtensions(): string[] {
    return Array.from(this.parsers.keys());
  }
}
