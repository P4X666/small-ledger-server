import { readdirSync, rmSync } from 'fs';
import { join, extname } from 'path';
import AdmZip from 'adm-zip';
import {
  ExcelParser,
  ExcelParserOptions,
  ExcelParseResult,
} from '../../excel/excel.interface';
import { CsvParser } from './csv.parser';

export class ZipParser extends ExcelParser {
  get supportedExtensions(): string[] {
    return ['.zip'];
  }

  async parse(
    filePath: string,
    options: ExcelParserOptions = {},
  ): Promise<ExcelParseResult> {
    const startTime = Date.now();
    let tempDir: string | undefined;

    try {
      // 创建临时目录用于存放解压后的文件
      tempDir = join(__dirname, `temp_${Date.now()}`);
      // 解压zip文件
      const zip = new AdmZip(filePath);
      zip.extractAllTo(tempDir, true);

      // 查找CSV文件
      const csvFiles = this.findCsvFiles(tempDir);

      if (csvFiles.length === 0) {
        throw new Error(
          'ZIP文件中未找到CSV文件，请确保压缩包中包含至少一个CSV格式的账单文件',
        );
      }

      if (csvFiles.length > 1) {
        throw new Error(
          'ZIP文件中包含多个CSV文件，仅支持单个CSV文件，请确保压缩包中只包含一个账单文件',
        );
      }
      // 使用CsvParser解析CSV文件
      const csvParser = new CsvParser();
      const result = await csvParser.parse(csvFiles[0], options);

      return {
        ...result,
        fileType: 'csv',
        parseTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('解析ZIP文件失败:', error.message);
      console.error(error.stack);
      throw new Error(`解析ZIP文件失败: ${(error as Error).message}`);
    } finally {
      // 清理临时文件
      if (tempDir) {
        try {
          rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('清理临时文件失败:', cleanupError.message);
        }
      }
    }
  }

  async validateFormat(filePath: string): Promise<boolean> {
    try {
      // 验证文件是否为有效的zip文件
      const zip = new AdmZip(filePath);
      const entries = zip.getEntries();

      // 检查zip文件是否为空
      if (entries.length === 0) {
        return false;
      }

      // 检查是否包含CSV文件
      for (const entry of entries) {
        if (
          !entry.isDirectory &&
          entry.entryName.toLowerCase().endsWith('.csv')
        ) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 查找目录中的所有CSV文件
   */
  private findCsvFiles(directory: string): string[] {
    const csvFiles: string[] = [];

    const files = readdirSync(directory, { withFileTypes: true });

    for (const file of files) {
      const fullPath = join(directory, file.name);

      if (file.isDirectory()) {
        // 递归查找子目录
        csvFiles.push(...this.findCsvFiles(fullPath));
      } else if (extname(file.name).toLowerCase() === '.csv') {
        csvFiles.push(fullPath);
      }
    }

    return csvFiles;
  }
}
