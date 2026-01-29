import type { CreateTransactionDto } from "@/transactions/transactions.dto";
import type { ExcelParseResult } from "../excel.interface";

/**
 * Excel 相关事件类型
 */
export enum ExcelEventTypes {
  /** 文件上传事件 */
  FILE_UPLOADED = 'excel.file.uploaded',
  /** 账单处理完成事件 */
  BILL_PROCESSED = 'excel.bill.processed',
}

export interface FileMetadata {
  /** 文件原始名称（含扩展名） */
  originalname: string;
  /** 文件存储路径（绝对/相对路径） */
  path: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件 MIME 类型 */
  mimetype: string;
  /** 文件存储后的名称（随机/哈希名） */
  filename: string;
  /** 可选：文件存储目录 */
  destination?: string;
}

/**
 * 文件上传事件数据
 */
export interface FileUploadedEvent {
  /** 上传的文件信息 */
  file: FileMetadata;
  /** 用户 ID */
  userId: number;
  /** 原始文件名 */
  originalname: string;
  /** 文件路径 */
  filePath: string;
}

export interface BillItem extends CreateTransactionDto {
  /** 交易的金额 */
  mount: number;
}

/**
 * 账单处理完成事件数据
 */
export interface BillProcessedEvent {
  /** 处理结果 */
  result: {
    parsedData: ExcelParseResult;
    categorizedData: {
      income: BillItem[];
      expense: BillItem[];
      neutral: BillItem[];
    };
    exportResult: {
      importedCount: number;
    };
  };
  /** 用户 ID */
  userId: number;
  /** 原始文件名 */
  originalname: string;
}
