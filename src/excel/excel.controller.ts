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
        let fileExt = '';

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch && filenameMatch[1]) {
            originalname = filenameMatch[1];
            fileExt = extname(originalname);
          }
        }

        // 如果没有文件名，根据Content-Type推断扩展名
        if (!fileExt) {
          if (
            contentType.includes('excel') ||
            contentType.includes('spreadsheet')
          ) {
            fileExt = '.xlsx';
          } else if (contentType.includes('csv')) {
            fileExt = '.csv';
          } else if (
            contentType.includes('zip') ||
            contentType.includes('compressed')
          ) {
            fileExt = '.zip';
          } else {
            // 检查文件内容以确定是否为ZIP文件
            // ZIP文件的魔数是PK\x03\x04
            if (
              buffer.length >= 4 &&
              buffer[0] === 0x50 &&
              buffer[1] === 0x4b &&
              buffer[2] === 0x03 &&
              buffer[3] === 0x04
            ) {
              fileExt = '.zip';
            } else {
              // 默认使用.xlsx
              fileExt = '.xlsx';
            }
          }
          originalname += fileExt;
        }

        // 验证文件类型
        const allowedExtensions = ['.xlsx', '.xls', '.csv', '.zip'];
        const ext = extname(originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
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
        const filename = `${randomName}${ext}`;
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
      if (ext === '.xlsx' || ext === '.xls') {
        // xlsx格式文件的数据从第16行开始，需要跳过15行
        // 确保第17行被正确识别为有效数据行
        skipRows = 15;
      } else if (ext === '.csv') {
        // csv格式文件的数据从第5行开始，需要跳过4行
        skipRows = 4;
      } else if (ext === '.zip') {
        // zip文件中的CSV文件数据从第5行开始，需要跳过4行
        skipRows = 4;
      }

      // 解析文件
      const parsedData = await this.excelService.parse(file.path, { skipRows });

      // 分类数据
      const categorizedData = this.categorizeTransactions(parsedData.data);

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
          existingData = JSON.parse(existingContent);
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

  private categorizeTransactions(transactions: any[]): {
    income: any[];
    expense: any[];
    neutral: any[];
  } {
    const income: any[] = [];
    const expense: any[] = [];
    const neutral: any[] = [];

    transactions.forEach((transaction) => {
      // 过滤掉统计信息行和空行
      if (!transaction || Object.keys(transaction).length === 0) {
        return;
      }

      // 过滤掉文件末尾的统计信息
      const firstKey = Object.keys(transaction)[0];
      if (
        transaction[firstKey] ===
          '------------------------------------------------------------------------------------' ||
        (transaction[firstKey].includes('共') &&
          transaction[firstKey].includes('笔记录')) ||
        (transaction[firstKey].includes('收入') &&
          transaction[firstKey].includes('笔')) ||
        (transaction[firstKey].includes('支出') &&
          transaction[firstKey].includes('笔')) ||
        (transaction[firstKey].includes('支付宝') &&
          transaction[firstKey].includes('笔')) ||
        (transaction[firstKey].includes('余额宝') &&
          transaction[firstKey].includes('笔')) ||
        transaction[firstKey].includes('导出时间') ||
        transaction[firstKey].includes('用户')
      ) {
        return;
      }

      // 专门处理支付宝账单格式
      // 直接检查字段值，不进行字符串处理
      const isAlipayPayment =
        transaction['_10'] !== undefined && transaction['_15'] !== undefined;

      // 优先处理支付宝交易
      if (isAlipayPayment) {
        // 支付宝交易通常是支出，优先分类
        expense.push(transaction);
        return; // 跳过后续分类逻辑
      }

      // 专门处理微信支付账单格式
      // 检查是否是微信支付账单（基于字段名和交易类型）
      const isWechatPayment =
        transaction['交易类型'] !== undefined &&
        transaction['收/支'] !== undefined;

      // 优先处理微信支付交易
      if (isWechatPayment) {
        // 微信支付交易根据收/支字段分类
        if (transaction['收/支'] === '收入') {
          income.push(transaction);
        } else if (transaction['收/支'] === '支出') {
          expense.push(transaction);
        } else {
          neutral.push(transaction);
        }
        return; // 跳过后续分类逻辑
      }

      // 尝试从常见的收支字段中判断
      const directionFields = ['收/支', '收支', 'direction', 'E', 'K'];
      let directionType = '';

      for (const field of directionFields) {
        if (transaction[field] !== undefined) {
          directionType = String(transaction[field]);
          break;
        }
      }

      // 尝试从常见的金额字段中获取金额
      const amountFields = [
        '金额',
        '交易金额',
        '金额(元)',
        'amount',
        'AMOUNT',
        'F',
        '_9',
        'J',
      ];
      let amount = 0;

      for (const field of amountFields) {
        if (transaction[field] !== undefined) {
          const value = transaction[field];
          if (typeof value === 'number') {
            amount = value;
          } else if (typeof value === 'string') {
            // 尝试解析字符串为数字
            const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
            if (!isNaN(parsed)) {
              amount = parsed;
            }
          }
          break;
        }
      }

      // 尝试从交易类型字段判断
      const typeFields = ['交易类型', '类型', 'type', 'TYPE', 'B', 'I'];
      let transactionType = '';

      for (const field of typeFields) {
        if (transaction[field] !== undefined) {
          transactionType = String(transaction[field]).toLowerCase();
          break;
        }
      }

      // 专门处理第I列和第J列的情况
      if (transaction['I'] !== undefined && transaction['J'] !== undefined) {
        transactionType = String(transaction['I']).toLowerCase();
        const value = transaction['J'];
        if (typeof value === 'number') {
          amount = value;
        } else if (typeof value === 'string') {
          const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
          if (!isNaN(parsed)) {
            amount = parsed;
          }
        }
      }

      // 其他交易的分类逻辑
      if (
        directionType === '收入' ||
        directionType === '收' ||
        directionType.includes('收入')
      ) {
        income.push(transaction);
      } else if (
        directionType === '支出' ||
        directionType === '支' ||
        directionType.includes('支出') ||
        directionType.includes('消费') ||
        directionType.includes('转账') ||
        directionType.includes('支付')
      ) {
        expense.push(transaction);
      } else if (amount > 0) {
        income.push(transaction);
      } else if (amount < 0) {
        expense.push(transaction);
      } else {
        // 金额为0或无法判断时，根据交易类型判断
        if (
          transactionType.includes('收入') ||
          transactionType.includes('in') ||
          transactionType.includes('income')
        ) {
          income.push(transaction);
        } else if (
          transactionType.includes('支出') ||
          transactionType.includes('out') ||
          transactionType.includes('expense') ||
          transactionType.includes('消费') ||
          transactionType.includes('转账') ||
          transactionType.includes('支付')
        ) {
          expense.push(transaction);
        } else {
          neutral.push(transaction);
        }
      }
    });

    return {
      income,
      expense,
      neutral,
    };
  }
}
