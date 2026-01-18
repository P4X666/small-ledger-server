import csvParser from 'csv-parser';
import { createReadStream, statSync } from 'fs';
import {
  ExcelParser,
  ExcelParserOptions,
  ExcelParseResult,
} from './excel.interface';

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
  private readonly amountFieldKeywords = ['amount', '金额', 'amt', '_9'];
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

    return new Promise<ExcelParseResult>((resolve, reject) => {

      try {
        // 异步流式读取文件
        const stream = createReadStream(filePath, { highWaterMark: 64 * 1024 });

        // 读取文件头部用于编码检测
        let headerBuffer: Buffer = Buffer.alloc(0);
        let encoding: string = 'utf8';
        let delimiter: string = ',';
        let encodingDetected = false;

        stream
          .on('data', (chunk: Buffer) => {
            if (!encodingDetected) {
              headerBuffer = Buffer.concat([headerBuffer, chunk]);
              if (headerBuffer.length >= 1024) {
                // 检测编码
                encoding = this.detectFileEncoding(filePath, headerBuffer);
                // 解码头部内容用于检测分隔符
                const iconv = require('iconv-lite');
                const headerContent = iconv
                  .decode(headerBuffer, encoding)
                  .replace(/^\ufeff/, '');
                delimiter = this.detectCsvDelimiter(headerContent);
                encodingDetected = true;
              }
            }
          })
          .on('end', () => {
            // 如果文件很小，在end事件中检测编码
            if (!encodingDetected) {
              encoding = this.detectFileEncoding(filePath, headerBuffer);
              const iconv = require('iconv-lite');
              const headerContent = iconv
                .decode(headerBuffer, encoding)
                .replace(/^\ufeff/, '');
              delimiter = this.detectCsvDelimiter(headerContent);
              encodingDetected = true;

              // 重新创建流进行解析
              this.parseWithEncoding(filePath, encoding, delimiter, options)
                .then((result) => {
                  const endTime = Date.now();
                  resolve({
                    ...result,
                    parseTime: endTime - startTime,
                  });
                })
                .catch(reject);
            }
          })
          .on('error', (error: Error) => {
            reject(new Error(`读取文件失败: ${error.message}`));
          });

        // 如果编码已经检测完成，直接解析
        if (encodingDetected) {
          this.parseWithEncoding(filePath, encoding, delimiter, options)
            .then((result) => {
              const endTime = Date.now();
              resolve({
                ...result,
                parseTime: endTime - startTime,
              });
            })
            .catch(reject);
        }
      } catch (error) {
        reject(new Error(`初始化解析器失败: ${(error as Error).message}`));
      }
    });
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
      let headerProcessed = false;
      let skipCount = options.skipRows || 0;
      let batchBuffer: any[] = [];

      try {
        const iconv = require('iconv-lite');
        const stream = createReadStream(filePath);

        // 转换编码的转换流
        const decodeStream = iconv.decodeStream(encoding);

        stream
          .pipe(decodeStream)
          .pipe(
            csvParser({
              separator: delimiter,
              skipLines: 0,
              strict: true,
            }),
          )
          .on('headers', () => {
            headerProcessed = true;
          })
          .on('data', (data: any) => {
            // 跳过指定行数
            if (skipCount > 0) {
              skipCount--;
              return;
            }

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
          })
          .on('end', () => {
            const endTime = Date.now();

            // 处理最后一批数据
            if (batchBuffer.length > 0 && options.batchCallback) {
              options.batchCallback(batchBuffer);
            }

            resolve({
              data: results,
              fileType: 'csv',
              totalRows: totalRows + (headerProcessed ? 1 : 0), // 包括表头
              parseTime: endTime - startTime,
            });
          })
          .on('error', (error: Error) => {
            console.warn(`解析CSV文件失败: ${error.message}`);
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
          const garbledCount = (utf8Decoded.match(CsvParser.REGEX_GARBLED) || []).length;
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
    const cleanedData: any = {};

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        let value = data[key];
        if (typeof value === 'string') {
          // 仅非金额字段清理乱码
          if (!this.isAmountField(key)) {
            value = this.cleanString(value);
          }
          // 通用清理：控制字符（金额字段也需要）
          value = value.replace(CsvParser.REGEX_AMOUNT_CLEAN, '');
        }
        cleanedData[key] = value;
      }
    }
    return cleanedData;
  }

  /**
   * 清理字符串中的乱码
   */
  private cleanString(str: string): string {
    // 1. 基础清理：控制字符、零宽度字符
    let cleaned = str.replace(CsvParser.REGEX_CONTROL_CHARS, '').trim();

    // 2. 空值处理
    if (!cleaned) return '';

    // 3. 乱码字符清理（仅移除乱码，保留其他字符）
    cleaned = cleaned.replace(CsvParser.REGEX_GARBLED, '');

    // 4. 合理短内容保留（如"123-"、"AB&C"）
    if (cleaned.length < 5) {
      // 仅当无有效字符时替换
      if (!CsvParser.REGEX_VALID_CHARS.test(cleaned)) {
        return '';
      }
      return cleaned;
    }

    // 5. 保留合法内容（中文/字母数字/常见符号）
    if (CsvParser.REGEX_VALID_CHARS_MULTIPLE.test(cleaned)) {
      return cleaned;
    }

    return '';
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
