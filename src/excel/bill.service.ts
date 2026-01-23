import { Injectable } from '@nestjs/common';
import { extname, join } from 'path';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { BillCategory, PayType } from '../enum';
import { ExcelService } from './excel.service';

/**
 * 账单服务
 * 处理账单相关的操作，包括交易分类、账单导出和数据合并
 */
@Injectable()
export class BillService {
  constructor(private readonly excelService: ExcelService) { }

  /**
   * 根据文件类型获取跳过行数
   * @param fileExtension 文件扩展名
   * @returns 跳过行数和支付类型
   */
  getParserOptions(fileExtension: string): {
    skipRows: number;
    payType: PayType;
  } {
    let skipRows = 0;
    let payType: PayType = PayType.Alipay;

    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // xlsx格式文件的数据从第16行开始
      skipRows = 16;
      payType = PayType.WechatPay;
    } else if (fileExtension === '.csv' || fileExtension === '.zip') {
      // CSV文件和ZIP中的CSV文件数据从第4行开始
      skipRows = 4;
      // 支付宝支付账单通常是zip文件解压后是csv格式
      payType = PayType.Alipay;
    }

    return { skipRows, payType };
  }

  // 微信账单分类
  private wechatpayCategoryHandle(standardizedTransaction: Record<string, string>) {
    let category = BillCategory.Neutral;
    const key = '收/支'
    if (standardizedTransaction[key] !== undefined) {
      const direction = standardizedTransaction[key];
      if (direction === '收入') {
        category = BillCategory.Income;
      } else if (direction === '支出') {
        category = BillCategory.Expense;
      }
    }
    return category
  }
  private alipayCategoryHandle(standardizedTransaction: Record<string, string>) {
    let category = BillCategory.Neutral;
    const key = '资金状态'
    if (standardizedTransaction[key] !== undefined) {
      const direction = standardizedTransaction[key];
      if (direction === '已收入') {
        category = BillCategory.Income;
      } else if (direction === '已支出') {
        category = BillCategory.Expense;
      }
    }
    return category
  }
  private generateTransaction(standardizedTransaction: Record<string, string>, payType: PayType,){
    const billData = {
      platform: payType,

    } as {
      /** 平台来源 */
      platform: PayType,
      /** 交易的商店 */
      shop: string,
      /** 交易的商品 */
      product: string,
      /** 交易的金额 */
      mount: string,
      /** 收支类型 */
      category: BillCategory
    }
    if(payType === PayType.Alipay){
      billData.category = this.alipayCategoryHandle(standardizedTransaction)
      billData.shop = standardizedTransaction['交易对方']
      billData.product = standardizedTransaction['商品名称']
      billData.mount = standardizedTransaction['金额（元）']
    }else if(payType === PayType.WechatPay){
      billData.category = this.wechatpayCategoryHandle(standardizedTransaction)
      billData.shop = standardizedTransaction['交易类型'] + standardizedTransaction['交易对方']
      billData.product = standardizedTransaction['商品']
      billData.mount = standardizedTransaction['金额(元)']
    }

    return billData
  }
  /**
   * 分类交易数据
   * @param transactions 交易数据
   * @param payType 支付类型
   * @returns 分类后的交易数据
   */
  categorizeTransactions(
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
      const standardizedTransaction = this.generateTransaction(transaction, payType);

      // 分类逻辑
      const category = standardizedTransaction.category;

      const cleanedTransaction = standardizedTransaction
      // 添加到相应分类
      if (category === 'income') {
        income.push(cleanedTransaction);
      } else if (category === 'expense') {
        expense.push(cleanedTransaction);
      } else {
        neutral.push(cleanedTransaction);
      }
    }

    return { income, expense, neutral };
  }

  /**
   * 导出账单数据到bill.json
   * @param categorizedData 分类后的交易数据
   * @returns 导出结果
   */
  exportToBillJson(categorizedData: {
    income: any[];
    expense: any[];
    neutral: any[];
  }): { outputFile: string } {
    const outputPath = join(process.cwd(), 'bill.json');

    // 读取现有的bill.json文件（如果存在）
    let existingData = {
      income: [],
      expense: [],
      neutral: [],
    };

    try {
      if (existsSync(outputPath)) {
        const existingContent = readFileSync(outputPath, 'utf8');
        if (existingContent) {
          existingData = JSON.parse(existingContent);
        }
      }
    } catch (error) {
      console.error('读取现有bill.json文件失败:', error.message);
    }

    // 合并并清理数据
    const mergedData = {
      income: [...existingData.income, ...categorizedData.income],
      expense: [...existingData.expense, ...categorizedData.expense],
      neutral: [...existingData.neutral, ...categorizedData.neutral],
    };

    // 写入合并后的数据
    writeFileSync(outputPath, JSON.stringify(mergedData, null, 2), 'utf8');

    return { outputFile: 'bill.json' };
  }

  /**
   * 处理账单文件
   * @param filePath 文件路径
   * @param originalname 原始文件名
   * @returns 处理结果
   */
  async processBillFile(
    filePath: string,
    originalname: string,
  ): Promise<{
    parsedData: any;
    categorizedData: {
      income: any[];
      expense: any[];
      neutral: any[];
    };
    exportResult: { outputFile: string };
  }> {
    // 获取文件扩展名
    const ext = extname(originalname).toLowerCase();

    // 获取解析选项
    const { skipRows, payType } = this.getParserOptions(ext);

    // 解析文件
    const parsedData = await this.excelService.parse(filePath, { skipRows });

    // 分类数据
    const categorizedData = this.categorizeTransactions(
      parsedData.data,
      payType,
    );

    // 导出到bill.json
    const exportResult = this.exportToBillJson(categorizedData);

    return { parsedData, categorizedData, exportResult };
  }
}
