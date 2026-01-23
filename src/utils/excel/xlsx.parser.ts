import { statSync } from 'fs';
import * as XLSX from 'xlsx';
import {
  ExcelParser,
  ExcelParserOptions,
  ExcelParseResult,
} from '../../excel/excel.interface';
import { cleanData } from './data-cleaner';

export class XlsxParser extends ExcelParser {
  get supportedExtensions(): string[] {
    return ['.xlsx', '.xls'];
  }

  // 正则预编译（与CSV解析器保持一致）
  private static readonly REGEX_CONTROL_CHARS =
    /[\x00-\x1F\x7F\u200B-\u200D\uFEFF]/g;
  private static readonly REGEX_GARBLED = /[\ufffd]/g;
  private static readonly REGEX_VALID_CHARS = /[\u4e00-\u9fa5a-zA-Z0-9]/;
  private static readonly REGEX_VALID_CHARS_MULTIPLE =
    /[\u4e00-\u9fa5a-zA-Z0-9]{2,}/;
  private static readonly REGEX_AMOUNT_CLEAN = /[\x00-\x1F\x7F]/g;

  // 配置化常量（与CSV解析器保持一致）
  private readonly amountFieldKeywords = ['金额'];
  private readonly batchSize = 1000; // 分批处理大小

  async parse(
    filePath: string,
    options: ExcelParserOptions = {},
  ): Promise<ExcelParseResult> {
    const startTime = Date.now();

    // 验证文件存在
    try {
      statSync(filePath);
    } catch {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 读取XLSX文件
    const workbook = XLSX.readFile(filePath);

    // 获取工作表（支持指定sheetName或使用第一个工作表）
    const sheetName = options.sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error(`工作表不存在: ${sheetName}`);
    }

    // 转换为JSON格式，获取所有数据行
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // 获取原始数据数组
      range: 0, // 从第0行开始
      raw: false, // 保持原始类型
    });

    // 跳过指定行数
    const skipRows = options.skipRows || 0;
    const dataAfterSkip = jsonData.slice(skipRows);

    // 确保有足够的行
    if (dataAfterSkip.length === 0) {
      return {
        data: [],
        fileType: 'xlsx',
        totalRows: 0,
        parseTime: Date.now() - startTime,
      };
    }

    const results: any[] = [];
    let totalRows = 0;
    let batchBuffer: any[] = [];

    const headers = dataAfterSkip[0];

    const dataStartIndex = 1;

    // 处理数据行
    for (let i = dataStartIndex; i < dataAfterSkip.length; i++) {
      const line = dataAfterSkip[i];

      // 跳过非数组行（可能是转换错误）
      if (!Array.isArray(line)) {
        continue;
      }

      // 跳过空行
      if (line.every((cell: any) => !cell || cell === '')) {
        continue;
      }

      // 确保行数据有足够的列
      if (line.length < (headers as string[]).length) {
        continue;
      }

      // 构建数据对象
      const data: any = {};
      (headers as string[]).forEach((header, headerIndex) => {
        const value = line[headerIndex];
        data[header] = value !== undefined && value !== null ? value : '';
      });

      // 跳过无效数据行（如只有表头重复的行）
      if (Object.values(data).every((value: any) => !value || value === '')) {
        continue;
      }

      // 清理数据
      const cleanedData = this.cleanData(data);
      results.push(cleanedData);
      batchBuffer.push(cleanedData);
      totalRows++;

      // 分批处理
      if (batchBuffer.length >= this.batchSize) {
        // 触发分批回调
        if (options.batchCallback) {
          options.batchCallback(batchBuffer);
        }
        // 清空缓冲区释放内存
        batchBuffer = [];
      }
    }

    // 处理最后一批数据
    if (batchBuffer.length > 0 && options.batchCallback) {
      options.batchCallback(batchBuffer);
    }

    return {
      data: results,
      fileType: 'xlsx',
      totalRows: totalRows, // 只计算数据行数
      parseTime: Date.now() - startTime,
    };
  }

  /**
   * 清理数据中的乱码
   */
  private cleanData(data: any): any {
    const cleanedData = cleanData(data, this.amountFieldKeywords);

    // 确保备注字段在无数据时默认填充为"/"
    if (!cleanedData['备注'] || cleanedData['备注'] === '') {
      cleanedData['备注'] = '/';
    }

    return cleanedData;
  }

  async validateFormat(filePath: string): Promise<boolean> {
    try {
      // 验证文件存在
      statSync(filePath);

      // 尝试读取文件
      const workbook = XLSX.readFile(filePath);

      // 检查是否有工作表
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return false;
      }

      // 检查第一个工作表是否有数据
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        range: 0,
        raw: false,
      });

      return Array.isArray(jsonData) && jsonData.length > 0;
    } catch {
      return false;
    }
  }
}
