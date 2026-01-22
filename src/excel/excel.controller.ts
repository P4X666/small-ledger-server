import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExcelService } from './excel.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { FileTypeUtils } from './file-type-utils';
import { PayType } from 'src/enum';

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.xlsx', '.xls', '.csv', '.zip'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error('不支持的文件类型，仅支持Excel、CSV和ZIP文件'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Req() req: any,
    @Headers('content-type') contentType: string,
    @Headers('content-disposition') contentDisposition: string,
  ) {
    // 处理Binary格式上传
    if (!file && contentType && !contentType.includes('multipart/form-data')) {
      try {
        // 从请求体中读取二进制数据
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: any[] = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', () => resolve(Buffer.concat(chunks)));
          req.on('error', reject);
        });

        if (buffer.length === 0) {
          return {
            status: 'error',
            message: '请选择要上传的文件',
          };
        }

        // 从Content-Disposition头中提取文件名
        let originalname = 'uploaded-file';

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch && filenameMatch[1]) {
            originalname = filenameMatch[1];
          }
        }

        // 确定最终的文件扩展名
        let finalExt = FileTypeUtils.determineFileExtension(
          originalname,
          contentType,
          buffer,
        );

        // 如果没有扩展名，添加默认扩展名
        if (!finalExt) {
          finalExt = '.xlsx';
          originalname += finalExt;
        } else if (!originalname.endsWith(finalExt)) {
          originalname += finalExt;
        }

        // 特殊处理：确保xlsx文件不会被错误识别为zip文件
        // 当Content-Type明确表示为Excel文件时，强制使用.xlsx扩展名
        if (
          (contentType.includes('excel') ||
            contentType.includes('spreadsheet') ||
            contentType ===
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') &&
          finalExt === '.zip'
        ) {
          finalExt = '.xlsx';
          originalname = originalname.replace(/\.zip$/i, '.xlsx');
        }

        // 验证文件类型
        const allowedExtensions = ['.xlsx', '.xls', '.csv', '.zip'];
        if (!allowedExtensions.includes(finalExt.toLowerCase())) {
          return {
            status: 'error',
            message: '不支持的文件类型，仅支持Excel、CSV和ZIP文件',
          };
        }

        // 生成随机文件名并保存到uploads目录
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        const filename = `${randomName}${finalExt}`;
        const destination = './uploads';
        const path = join(destination, filename);

        // 确保uploads目录存在
        if (!existsSync(destination)) {
          mkdirSync(destination, { recursive: true });
        }

        // 写入文件
        writeFileSync(path, buffer);

        // 构建file对象，与multer生成的格式一致
        file = {
          fieldname: 'file',
          originalname: originalname,
          encoding: '7bit',
          mimetype: contentType,
          destination: destination,
          filename: filename,
          path: path,
          size: buffer.length,
        };
      } catch (error) {
        return {
          status: 'error',
          message: `处理二进制文件时出错: ${error.message}`,
        };
      }
    }

    // 检查文件是否存在
    if (!file) {
      return {
        status: 'error',
        message: '请选择要上传的文件',
      };
    }

    try {
      // 根据文件类型设置跳过行数
      const ext = extname(file.originalname).toLowerCase();
      let skipRows = 0;
      let payType: PayType = PayType.Alipay;
      if (ext === '.xlsx' || ext === '.xls') {
        // xlsx格式文件的数据从第16行开始
        // 确保第16行被正确识别为表头行，第16行开始为有效数据行
        skipRows = 16;
        payType = PayType.WechatPay;
      } else if (ext === '.csv' || ext === '.zip') {
        // CSV文件和ZIP中的CSV文件数据从第4行开始
        // 确保第4行被正确识别为表头行，第5行开始为有效数据行
        skipRows = 4;
        // 支付宝支付账单通常是zip文件解压后是csv格式，第4行是表头，第5行开始为有效数据行
        payType = PayType.Alipay;
      }

      // 解析文件前再次验证文件类型和扩展名的一致性
      try {
        // 尝试验证文件是否为有效的Excel文件
        // 只有当文件的原始扩展名是.xlsx或.xls时，才尝试使用Excel解析器验证文件
        // 这样可以确保zip格式文件上传后保持zip格式不变
        const originalExt = extname(file.originalname).toLowerCase();
        const currentExt = extname(file.filename).toLowerCase();

        // 只有当文件的原始扩展名是.xlsx或.xls时，才尝试使用Excel解析器验证文件
        if (['.xlsx', '.xls'].includes(originalExt)) {
          // 尝试用Excel解析器解析
          const xlsxParser = require('./xlsx.parser').XlsxParser;
          const parser = new xlsxParser();
          const isExcelFile = await parser.validateFormat(file.path);

          // 如果是有效的Excel文件但扩展名不是.xlsx或.xls，修正扩展名
          if (isExcelFile && !['.xlsx', '.xls'].includes(currentExt)) {
            // 重命名文件为.xlsx扩展名
            const newFilename = file.filename.replace(currentExt, '.xlsx');
            const newPath = join(file.destination, newFilename);
            const fs = require('fs');
            if (fs.existsSync(file.path)) {
              fs.renameSync(file.path, newPath);
              // 更新file对象
              file.filename = newFilename;
              file.path = newPath;
            }
          }
        }
        // 对于zip文件，保持其原始格式不变
        else if (originalExt === '.zip' && currentExt !== '.zip') {
          // 确保zip文件使用正确的扩展名
          const newFilename = file.filename.replace(currentExt, '.zip');
          const newPath = join(file.destination, newFilename);
          const fs = require('fs');
          if (fs.existsSync(file.path)) {
            fs.renameSync(file.path, newPath);
            // 更新file对象
            file.filename = newFilename;
            file.path = newPath;
          }
        }
      } catch (error) {
        // 验证失败不影响后续处理，继续尝试解析
        console.log('文件类型验证失败，继续尝试解析:', error.message);
      }

      // 解析文件
      const parsedData = await this.excelService.parse(file.path, { skipRows });

      // 分类数据
      const categorizedData = this.categorizeTransactions(
        parsedData.data,
        payType,
      );

      // 导出到bill.json
      const outputPath = join(process.cwd(), 'bill.json');

      // 读取现有的bill.json文件（如果存在）
      let existingData = {
        income: [],
        expense: [],
        neutral: [],
      };

      try {
        if (existsSync(outputPath)) {
          const fs = require('fs');
          const existingContent = fs.readFileSync(outputPath, 'utf8');
          if (existingContent) {
            existingData = JSON.parse(existingContent);
          }
        }
      } catch (error) {
        console.error('读取现有bill.json文件失败:', error.message);
      }

      // 清理数据中的乱码
      const cleanData = (data: any[]): any[] => {
        return data.map((item) => {
          const cleanedItem: any = {};
          for (const key in item) {
            if (Object.prototype.hasOwnProperty.call(item, key)) {
              let value = item[key];
              if (typeof value === 'string') {
                // 移除控制字符
                value = value.replace(/[\u0000-\u001F\u007F]/g, '');
                // 移除零宽度字符
                value = value.replace(/[\u200B-\u200D\uFEFF]/g, '');
                // 清理乱码
                value = cleanString(value);
              }
              cleanedItem[key] = value;
            }
          }
          return cleanedItem;
        });
      };

      // 清理字符串中的乱码
      const cleanString = (str: string): string => {
        // 方法1: 直接返回字符串（避免过度处理）
        let result = str;

        // 方法2: 清理特殊字符和控制字符
        try {
          result = result.replace(/[\u0000-\u001F\u007F]/g, ''); // 移除控制字符
          result = result.replace(/[\u200B-\u200D\uFEFF]/g, ''); // 移除零宽度字符
          result = result.replace(/[\ufffd]/g, ''); // 移除无效UTF-8字符
          result = result.trim(); // 清理多余空格
        } catch {
          // 忽略错误
        }

        return result;
      };

      // 合并并清理数据
      const mergedData = {
        income: [
          ...cleanData(existingData.income),
          ...cleanData(categorizedData.income),
        ],
        expense: [
          ...cleanData(existingData.expense),
          ...cleanData(categorizedData.expense),
        ],
        neutral: [
          ...cleanData(existingData.neutral),
          ...cleanData(categorizedData.neutral),
        ],
      };

      // 写入合并后的数据
      writeFileSync(outputPath, JSON.stringify(mergedData, null, 2), 'utf8');

      return {
        status: 'success',
        message: '文件上传和处理成功',
        data: {
          fileName: file.originalname,
          fileSize: file.size,
          totalRows: parsedData.totalRows,
          parseTime: parsedData.parseTime,
          outputFile: 'bill.json',
          categorizedCounts: {
            income: categorizedData.income.length,
            expense: categorizedData.expense.length,
            neutral: categorizedData.neutral.length,
          },
        },
      };
    } catch (error) {
      return {
        status: 'error',
        message: `处理文件时出错: ${error.message}`,
      };
    }
  }

  private categorizeTransactions(
    transactions: any[],
    payType: PayType,
  ): {
    income: any[];
    expense: any[];
    neutral: any[];
  } {
    const income: any[] = [];
    const expense: any[] = [];
    const neutral: any[] = [];

    for (const transaction of transactions) {
      // 过滤掉统计信息行和空行
      if (!transaction || Object.keys(transaction).length === 0) {
        continue;
      }

      // 转换为标准格式
      const standardizedTransaction = transaction;

      // 分类逻辑
      let category = 'neutral';

      // 基于收/支字段分类
      if (standardizedTransaction['收/支'] !== undefined) {
        const direction = standardizedTransaction['收/支'];
        if (direction === '收入') {
          category = 'income';
        } else if (direction === '支出') {
          category = 'expense';
        }
      }
      // 基于金额字段分类
      else if (standardizedTransaction['金额（元）'] !== undefined) {
        const amountStr = String(standardizedTransaction['金额（元）']);
        const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ''));
        if (!isNaN(amount)) {
          if (amount > 0) {
            category = 'income';
          } else if (amount < 0) {
            category = 'expense';
          }
        }
      }

      // 支付宝账单默认分类为支出，除非明确为收入
      if (payType === PayType.Alipay && category === 'neutral') {
        category = 'expense';
      }

      // 清理交易对象，只保留有值的字段
      const cleanedTransaction: any = {};
      for (const key in standardizedTransaction) {
        if (
          Object.prototype.hasOwnProperty.call(standardizedTransaction, key)
        ) {
          const value = standardizedTransaction[key];
          if (value !== undefined && value !== '' && value !== null) {
            cleanedTransaction[key] = value;
          }
        }
      }

      // 添加到相应分类
      if (category === 'income') {
        income.push(cleanedTransaction);
      } else if (category === 'expense') {
        expense.push(cleanedTransaction);
      } else {
        neutral.push(cleanedTransaction);
      }
    }

    return {
      income,
      expense,
      neutral,
    };
  }
}
