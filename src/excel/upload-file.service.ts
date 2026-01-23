import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { FileTypeUtils } from '../utils/excel/file-type-utils';

/**
 * 文件上传服务
 * 处理文件上传相关的操作，包括二进制文件处理、文件类型验证和文件保存
 */
@Injectable()
export class UploadFileService {
  /**
   * 支持的文件扩展名
   */
  private readonly allowedExtensions = ['.xlsx', '.xls', '.csv', '.zip'];

  /**
   * 处理二进制文件上传
   * @param req 请求对象
   * @param contentType 内容类型
   * @param contentDisposition 内容处置头
   * @returns 处理后的文件对象
   */
  async handleBinaryUpload(
    req: any,
    contentType: string,
    contentDisposition: string,
  ): Promise<any> {
    // 从请求体中读取二进制数据
    const buffer = await this.readBinaryData(req);

    if (buffer.length === 0) {
      throw new Error('请选择要上传的文件');
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
    this.validateFileExtension(finalExt);

    // 生成随机文件名并保存到uploads目录
    const fileInfo = this.saveFile(buffer, finalExt, originalname);

    // 构建file对象，与multer生成的格式一致
    return {
      fieldname: 'file',
      originalname: fileInfo.originalname,
      encoding: '7bit',
      mimetype: contentType,
      destination: fileInfo.destination,
      filename: fileInfo.filename,
      path: fileInfo.path,
      size: buffer.length,
    };
  }

  /**
   * 从请求体中读取二进制数据
   * @param req 请求对象
   * @returns 二进制数据缓冲区
   */
  private async readBinaryData(req: any): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  /**
   * 验证文件扩展名
   * @param ext 文件扩展名
   */
  private validateFileExtension(ext: string): void {
    if (!this.allowedExtensions.includes(ext.toLowerCase())) {
      throw new Error('不支持的文件类型，仅支持Excel、CSV和ZIP文件');
    }
  }

  /**
   * 保存文件到uploads目录
   * @param buffer 文件数据缓冲区
   * @param ext 文件扩展名
   * @param originalname 原始文件名
   * @returns 文件信息
   */
  private saveFile(buffer: Buffer, ext: string, originalname: string): any {
    // 生成随机文件名
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

    return {
      originalname,
      filename,
      destination,
      path,
    };
  }

  /**
   * 验证文件是否存在
   * @param file 文件对象
   */
  validateFileExists(file: any): void {
    if (!file) {
      throw new Error('请选择要上传的文件');
    }
  }
}
