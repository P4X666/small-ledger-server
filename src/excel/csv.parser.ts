import { createReadStream, statSync } from 'fs';
import {
  ExcelParser,
  ExcelParserOptions,
  ExcelParseResult,
} from './excel.interface';
import { cleanData } from '../utils/data-cleaner';

export class CsvParser extends ExcelParser {
  get supportedExtensions(): string[] {
    return ['.csv'];
  }

  // 正则预编译
  private static readonly REGEX_CONTROL_CHARS =
    /[\x00-\x1F\x7F\u200B-\u200D\uFEFF]/g;
  private static readonly REGEX_GARBLED = /[\ufffd]/g;
  private static readonly REGEX_VALID_CHARS = /[\u4e00-\u9fa5a-zA-Z0-9]/;
  private static readonly REGEX_VALID_CHARS_MULTIPLE =
    /[\u4e00-\u9fa5a-zA-Z0-9]{2,}/;
  private static readonly REGEX_CSV_DELIMITERS = /[,;\t]/;
  private static readonly REGEX_AMOUNT_CLEAN = /[\x00-\x1F\x7F]/g;

  // 编码缓存
  private encodingCache = new Map<string, string>();

  // 配置化常量
  private readonly amountFieldKeywords = ['金额'];
  private readonly delimiters = [',', ';', '\t', '|'];
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

    // 读取文件头部进行编码和分隔符检测
    const headerBuffer = Buffer.alloc(1024);
    const fs = require('fs');
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, headerBuffer, 0, 1024, 0);
    fs.closeSync(fd);

    // 检测编码
    const encoding = this.detectFileEncoding(filePath, headerBuffer);
    // 解码头部内容用于检测分隔符
    const iconv = require('iconv-lite');
    const headerContent = iconv
      .decode(headerBuffer, encoding)
      .replace(/^\ufeff/, '');
    const delimiter = this.detectCsvDelimiter(headerContent);

    // 直接使用检测到的编码和分隔符进行解析
    const result = await this.parseWithEncoding(
      filePath,
      encoding,
      delimiter,
      options,
    );
    return {
      ...result,
      parseTime: Date.now() - startTime,
    };
  }

  private async parseWithEncoding(
    filePath: string,
    encoding: string,
    delimiter: string,
    options: ExcelParserOptions = {},
  ): Promise<ExcelParseResult> {
    const startTime = Date.now();

    return new Promise<ExcelParseResult>((resolve, reject) => {
      const results: any[] = [];
      let totalRows = 0;
      let batchBuffer: any[] = [];
      const skipRows = options.skipRows || 0;
      let headers: string[] = [];

      try {
        const iconv = require('iconv-lite');
        const stream = createReadStream(filePath, {
          highWaterMark: 128 * 1024,
        });

        // 转换编码的转换流
        const decodeStream = iconv.decodeStream(encoding);

        // 读取原始文件内容，手动处理行跳过和表头提取
        let rawContent = '';

        stream
          .pipe(decodeStream)
          .on('data', (chunk: string) => {
            rawContent += chunk;
          })
          .on('end', () => {
            // 分割行
            const lines = rawContent.split('\n');

            // 跳过指定行数
            const linesAfterSkip = lines.slice(skipRows);

            // 确保有足够的行
            if (linesAfterSkip.length === 0) {
              resolve({
                data: [],
                fileType: 'csv',
                totalRows: 0,
                parseTime: Date.now() - startTime,
              });
              return;
            }

            // 提取表头行
            const headerLine = linesAfterSkip[0];
            headers = headerLine
              .split(delimiter)
              .map((header) => header.trim());

            // 数据行
            const dataLines = linesAfterSkip.slice(1);

            console.log(`数据行数量: ${dataLines.length}`);

            // 处理数据行
            for (const line of dataLines) {
              // 跳过空行
              if (!line.trim()) {
                break;
              }
              // 分割数据
              const values = line.split(delimiter).map((value) => value.trim());

              // 确保值的数量与表头数量匹配
              if (values.length !== headers.length) {
                // 跳过格式异常的行
                break;
              }
              // 结束标志
              if (values[0].includes('-------------------------------')) {
                break;
              }

              // 构建数据对象
              const data: any = {};
              headers.forEach((header, headerIndex) => {
                data[header] = values[headerIndex];
              });

              // 清理数据中的乱码
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

            console.log(`处理完成 ${totalRows} 条记录`);

            // 处理最后一批数据
            if (batchBuffer.length > 0 && options.batchCallback) {
              options.batchCallback(batchBuffer);
            }
            resolve({
              data: results,
              fileType: 'csv',
              totalRows: totalRows, // 只计算数据行数
              parseTime: Date.now() - startTime,
            });
          })
          .on('error', (error: Error) => {
            reject(new Error(`解析CSV文件失败: ${error.message}`));
          });
      } catch (error) {
        reject(new Error(`初始化解析器失败: ${(error as Error).message}`));
      }
    });
  }

  /**
   * 检测文件编码
   */
  private detectFileEncoding(filePath: string, buffer: Buffer): string {
    // 命中缓存直接返回
    if (this.encodingCache.has(filePath)) {
      return this.encodingCache.get(filePath)!;
    }

    // 检测BOM
    const bomInfo = this.detectBOM(buffer);
    let detectedEncoding: string;

    if (bomInfo) {
      detectedEncoding = bomInfo.encoding;
    } else {
      try {
        const utf8Decoded = buffer.toString('utf8');
        if (this.isValidCsvContent(utf8Decoded)) {
          const garbledCount = (
            utf8Decoded.match(CsvParser.REGEX_GARBLED) || []
          ).length;
          if (garbledCount === 0) {
            detectedEncoding = 'utf8';
          } else {
            detectedEncoding = this.detectEncodingWithFallback();
          }
        } else {
          detectedEncoding = this.detectEncodingWithFallback();
        }
      } catch {
        detectedEncoding = this.detectEncodingWithFallback();
      }
    }

    // 缓存编码
    this.encodingCache.set(filePath, detectedEncoding);
    return detectedEncoding;
  }

  /**
   * 使用chardet检测编码并添加回退逻辑
   */
  private detectEncodingWithFallback(): string {
    // 直接返回GBK编码，因为账单文件是用GBK编码创建的
    return 'gbk';
  }

  /**
   * 清理数据中的乱码
   */
  private cleanData(data: any): any {
    return cleanData(data, this.amountFieldKeywords);
  }

  /**
   * 检测CSV分隔符
   */
  private detectCsvDelimiter(content: string): string {
    // 统计常见分隔符的出现次数
    const counts = this.delimiters.map((d) => {
      const regex = new RegExp(`\\${d}`, 'g');
      return (content.match(regex) || []).length;
    });
    // 取出现次数最多的分隔符（排除空值）
    const maxCount = Math.max(...counts);
    return maxCount > 0 ? this.delimiters[counts.indexOf(maxCount)] : ',';
  }

  /**
   * 检测BOM
   */
  private detectBOM(
    buffer: Buffer,
  ): { encoding: string; bomLength: number } | null {
    // UTF-8 BOM
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return { encoding: 'utf8', bomLength: 3 };
    }
    // UTF-16 LE BOM
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      return { encoding: 'utf16le', bomLength: 2 };
    }
    // UTF-16 BE BOM
    if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      return { encoding: 'utf16be', bomLength: 2 };
    }
    return null;
  }

  /**
   * 验证CSV内容是否有效
   */
  private isValidCsvContent(content: string): boolean {
    // 1. 包含CSV分隔符
    const hasDelimiter = CsvParser.REGEX_CSV_DELIMITERS.test(content);
    // 2. 乱码字符占比<10%
    const garbledCount = (content.match(CsvParser.REGEX_GARBLED) || []).length;
    const garbledRatio = garbledCount / Math.max(content.length, 1);
    // 3. 包含有效字符
    const hasValidChars = CsvParser.REGEX_VALID_CHARS_MULTIPLE.test(content);

    return hasDelimiter && garbledRatio < 0.1 && hasValidChars;
  }

  /**
   * 判断是否为金额字段
   */
  private isAmountField(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return this.amountFieldKeywords.some((kw) =>
      lowerKey.includes(kw.toLowerCase()),
    );
  }

  async validateFormat(filePath: string): Promise<boolean> {
    try {
      // 验证文件存在
      statSync(filePath);

      // 读取文件头部
      const stream = createReadStream(filePath, { end: 1024 });
      let buffer: Buffer = Buffer.alloc(0);

      return new Promise<boolean>((resolve) => {
        stream
          .on('data', (chunk: Buffer) => {
            buffer = Buffer.concat([buffer, chunk]);
          })
          .on('end', () => {
            try {
              // 检测编码
              const encoding = this.detectFileEncoding(filePath, buffer);
              const iconv = require('iconv-lite');
              const content = iconv
                .decode(buffer, encoding)
                .replace(/^\ufeff/, '')
                .trim();
              resolve(content.length > 0 && this.isValidCsvContent(content));
            } catch {
              resolve(false);
            }
          })
          .on('error', () => {
            resolve(false);
          });
      });
    } catch {
      return false;
    }
  }
}
