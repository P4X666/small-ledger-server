import * as XLSX from 'xlsx';
import { statSync, readFileSync } from 'fs';
import chardet from 'chardet';
import {
  ExcelParser,
  ExcelParserOptions,
  ExcelParseResult,
} from './excel.interface';

export class XlsxParser extends ExcelParser {
  get supportedExtensions(): string[] {
    return ['.xlsx', '.xls'];
  }

  async parse(
    filePath: string,
    options: ExcelParserOptions = {},
  ): Promise<ExcelParseResult> {
    const startTime = Date.now();

    // 验证文件存在
    if (!statSync(filePath, { throwIfNoEntry: false })) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    try {
      // 读取文件内容
      const buffer = readFileSync(filePath);

      // 解析Excel文件
      const workbook = XLSX.read(buffer, {
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false,
      });

      // 选择工作表
      const sheetName = options.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`工作表不存在: ${sheetName}`);
      }

      // 解析数据
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: options.skipHeader ? 1 : 'A',
        defval: '',
      });

      // 处理数据格式
      let data = options.skipHeader
        ? jsonData
        : this.processHeaderData(jsonData);

      // 清理数据中的乱码
      data = this.cleanData(data);

      // 跳过指定行数
      if (options.skipRows && options.skipRows > 0) {
        data = data.slice(options.skipRows);
      }

      const endTime = Date.now();

      return {
        data,
        fileType: 'xlsx',
        totalRows: jsonData.length + (options.skipHeader ? 0 : 1),
        parseTime: endTime - startTime,
      };
    } catch (error) {
      throw new Error(`解析Excel文件失败: ${(error as Error).message}`);
    }
  }

  /**
   * 清理数据中的乱码
   */
  private cleanData(data: any[]): any[] {
    return data.map((item) => {
      if (Array.isArray(item)) {
        return item.map((value) => this.cleanValue(value));
      } else if (typeof item === 'object' && item !== null) {
        const cleanedItem: any = {};
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            cleanedItem[key] = this.cleanValue(item[key]);
          }
        }
        return cleanedItem;
      }
      return item;
    });
  }

  /**
   * 清理单个值
   */
  private cleanValue(value: any): any {
    if (typeof value === 'string') {
      // 移除控制字符
      let cleaned = value.replace(/[\x00-\x1F\x7F]/g, '');
      // 移除零宽度字符
      cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
      // 清理乱码（无效UTF-8字符）
      cleaned = cleaned.replace(/[\ufffd]/g, '');
      // 清理多余空格
      cleaned = cleaned.trim();
      return cleaned;
    }
    return value;
  }

  async validateFormat(filePath: string): Promise<boolean> {
    try {
      // 验证文件存在
      if (!statSync(filePath, { throwIfNoEntry: false })) {
        return false;
      }

      // 尝试读取文件
      const workbook = XLSX.readFile(filePath);
      return workbook.SheetNames.length > 0;
    } catch {
      return false;
    }
  }

  private processHeaderData(data: any[]): any[] {
    return data.map((row: any) => {
      const processedRow: any = {};
      Object.keys(row).forEach((key) => {
        // 处理表头，将字母表头转换为有意义的字段名
        // 映射Excel表格的列与字段的对应关系
        let fieldName = key;
        switch (key) {
          case 'A':
            fieldName = '交易时间';
            break;
          case 'B':
            fieldName = '交易类型';
            break;
          case 'C':
            fieldName = '交易对方';
            break;
          case 'D':
            fieldName = '商品';
            break;
          case 'E':
            fieldName = '收/支';
            break;
          case 'F':
            fieldName = '金额(元)';
            break;
          case 'G':
            fieldName = '支付方式';
            break;
          case 'H':
            fieldName = '当前状态';
            break;
          case 'I':
            fieldName = '交易单号';
            break;
          case 'J':
            fieldName = '商户单号';
            break;
          case 'K':
            fieldName = '备注';
            break;
          // 其他列保持原样
          default:
            fieldName = key;
        }
        processedRow[fieldName] = row[key];
      });
      return processedRow;
    });
  }
}
