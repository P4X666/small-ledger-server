import { Injectable } from '@nestjs/common';
import { extname } from 'path';
import { BillCategory, PayType } from '../enum';
import { ExcelService } from './excel.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateTransactionDto } from '../transactions/transactions.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; // 如需处理时区，需安装该插件
import { ExcelParseResult } from './excel.interface';

dayjs.extend(utc);

interface BillItem extends CreateTransactionDto {
  /** 交易的金额 */
  mount: number;
}

/**
 * 账单服务
 * 处理账单相关的操作，包括交易分类、账单导出和数据合并
 */
@Injectable()
export class BillService {
  constructor(
    private readonly excelService: ExcelService,
    private readonly transactionsService: TransactionsService,
  ) {}

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
  private wechatpayCategoryHandle(
    standardizedTransaction: Record<string, string>,
  ) {
    let category = BillCategory.Neutral;
    const key = '收/支';
    if (standardizedTransaction[key] !== undefined) {
      const direction = standardizedTransaction[key];
      if (direction === '收入') {
        category = BillCategory.Income;
      } else if (direction === '支出') {
        category = BillCategory.Expense;
      }
    }
    return category;
  }
  private alipayCategoryHandle(
    standardizedTransaction: Record<string, string>,
  ) {
    let category = BillCategory.Neutral;
    const key = '资金状态';
    if (standardizedTransaction[key] !== undefined) {
      const direction = standardizedTransaction[key];
      if (direction === '已收入') {
        category = BillCategory.Income;
      } else if (direction === '已支出') {
        category = BillCategory.Expense;
      }
    }
    return category;
  }
  private getAmountFromTransaction(amount: string) {
    let money = Number(amount);
    const unitArr = ['¥'];
    const currentUnit = unitArr.find((unit) => amount.includes(unit));
    if (currentUnit) {
      money = +amount.split(currentUnit)[1];
    }
    return money;
  }
  private generateTransaction(
    standardizedTransaction: Record<string, string>,
    payType: PayType,
    { startTime = '', endTime = '' },
  ): BillItem {
    const billData = {
      platform: payType,
      transactionStartDate: new Date(),
      transactionEndDate: new Date(),
    } as BillItem;

    let transactionDateValue: Date | undefined;

    if (payType === PayType.Alipay) {
      billData.billId = standardizedTransaction['交易号'];
      billData.category = this.alipayCategoryHandle(standardizedTransaction);
      billData.shop = standardizedTransaction['交易对方'];
      billData.product = standardizedTransaction['商品名称'];
      billData.mount = this.getAmountFromTransaction(
        standardizedTransaction['金额（元）'],
      );
      billData.description = standardizedTransaction['备注'];

      // 设置交易日期
      const transactionDate =
        standardizedTransaction['交易创建时间'] ||
        standardizedTransaction['付款时间'];
      if (transactionDate) {
        transactionDateValue = dayjs(transactionDate).toDate();
        billData.transactionDate = transactionDateValue;
      }
      billData.transactionStartDate = dayjs(startTime).toDate();
      billData.transactionEndDate = dayjs(endTime).toDate();
    } else if (payType === PayType.WechatPay) {
      billData.billId = standardizedTransaction['交易单号'];
      billData.category = this.wechatpayCategoryHandle(standardizedTransaction);
      billData.shop =
        standardizedTransaction['交易类型'] +
        standardizedTransaction['交易对方'];
      billData.product = standardizedTransaction['商品'];
      billData.mount = this.getAmountFromTransaction(
        standardizedTransaction['金额(元)'],
      );
      billData.description = standardizedTransaction['备注'];

      const transactionDate = standardizedTransaction['交易时间'];
      if (transactionDate) {
        transactionDateValue = dayjs(transactionDate).toDate();
        billData.transactionDate = transactionDateValue;
      }
      billData.transactionStartDate = dayjs(startTime).toDate();
      billData.transactionEndDate = dayjs(endTime).toDate();
    }

    return billData;
  }
  /**
   * 分类交易数据
   * @param transactions 交易数据
   * @param payType 支付类型
   * @returns 分类后的交易数据
   */
  categorizeTransactions(
    parseData: ExcelParseResult,
    payType: PayType,
  ): {
    income: BillItem[];
    expense: BillItem[];
    neutral: BillItem[];
  } {
    const transactions: any[] = parseData.data;
    const { startTime, endTime } = parseData;

    const income: BillItem[] = [];
    const expense: BillItem[] = [];
    const neutral: BillItem[] = [];

    for (const transaction of transactions) {
      // 过滤掉统计信息行和空行
      if (!transaction || Object.keys(transaction).length === 0) {
        continue;
      }

      // 转换为标准格式
      const standardizedTransaction = this.generateTransaction(
        transaction,
        payType,
        { startTime, endTime },
      );

      // 分类逻辑
      const category = standardizedTransaction.category;

      const cleanedTransaction = standardizedTransaction;
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

  private async createTransaction(
    userId: number,
    transcations: BillItem[],
    category: BillCategory,
  ): Promise<number> {
    let count = 0;

    for (const item of transcations) {
      // 确保billId存在，否则跳过该记录
      if (!item.billId) {
        console.warn('跳过缺少billId的记录:', item);
        continue;
      }

      const transactionDto: CreateTransactionDto = {
        ...item,
        type: category,
        amount: item.mount,
      };

      // 检查是否已存在该billId的交易记录
      const existingTransaction = await this.transactionsService.findByBillId(
        item.billId,
        userId,
      );

      if (existingTransaction) {
        // 如果存在，执行更新操作
        await this.transactionsService.update(
          existingTransaction.id,
          userId,
          transactionDto,
        );
      } else {
        // 如果不存在，执行新增操作
        await this.transactionsService.create(userId, transactionDto);
      }
      count++;
    }

    return count;
  }

  /**
   * 导出账单数据到transactions表
   * @param categorizedData 分类后的交易数据
   * @returns 导出结果
   */
  async exportToTransactions(
    categorizedData: {
      income: any[];
      expense: any[];
      neutral: any[];
    },
    userId: number,
  ): Promise<{ importedCount: number }> {
    let importedCount = 0;

    // 处理收入数据
    importedCount += await this.createTransaction(
      userId,
      categorizedData.income,
      BillCategory.Income,
    );
    // 处理支出数据
    importedCount += await this.createTransaction(
      userId,
      categorizedData.expense,
      BillCategory.Expense,
    );
    // 处理中性数据
    importedCount += await this.createTransaction(
      userId,
      categorizedData.neutral,
      BillCategory.Neutral,
    );

    return { importedCount };
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
    userId: number,
  ): Promise<{
    parsedData: any;
    categorizedData: {
      income: any[];
      expense: any[];
      neutral: any[];
    };
    exportResult: { importedCount: number };
  }> {
    // 获取文件扩展名
    const ext = extname(originalname).toLowerCase();

    // 获取解析选项
    const { skipRows, payType } = this.getParserOptions(ext);

    // 解析文件
    const parsedData = await this.excelService.parse(filePath, { skipRows });

    // 分类数据
    const categorizedData = this.categorizeTransactions(parsedData, payType);

    // 导出到transactions表
    const exportResult = await this.exportToTransactions(
      categorizedData,
      userId,
    );

    return { parsedData, categorizedData, exportResult };
  }
}
