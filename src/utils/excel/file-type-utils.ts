import { extname } from 'path';

/**
 * 文件类型工具类
 * 提供文件类型判断、扩展名提取等功能
 */
export class FileTypeUtils {
  /**
   * 根据文件内容判断文件类型
   * @param buffer 文件内容缓冲区
   * @returns 文件扩展名
   */
  static getFileTypeFromBuffer(buffer: Buffer): string {
    // 检查是否为ZIP文件（ZIP文件以PK开头）
    if (buffer.length >= 4) {
      const header = buffer.toString('hex', 0, 4);
      if (
        header === '504b0304' ||
        header === '504b0506' ||
        header === '504b0708'
      ) {
        // 是ZIP文件
        // 检查是否为Excel文件：使用更可靠的方法检测'xl/'字符串
        // 遍历缓冲区，查找'xl/'或'XL/'字符串
        // 循环条件修正：i < buffer.length - 2，因为我们需要检查3个字符的长度
        for (let i = 0; i < buffer.length - 2; i++) {
          const chunk = buffer.slice(i, i + 3).toString('ascii');
          if (chunk === 'xl/' || chunk === 'XL/') {
            return '.xlsx';
          }
        }
        return '.zip';
      }
    }

    // 默认返回.xlsx
    return '.xlsx';
  }

  /**
   * 根据Content-Type推断文件扩展名
   * @param contentType Content-Type头
   * @returns 文件扩展名
   */
  static getFileTypeFromContentType(contentType: string): string {
    if (
      contentType.includes('excel') ||
      contentType.includes('spreadsheet') ||
      contentType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return '.xlsx';
    } else if (contentType.includes('csv')) {
      return '.csv';
    } else if (
      contentType.includes('zip') ||
      contentType.includes('compressed') ||
      contentType === 'application/zip' ||
      contentType === 'application/x-zip-compressed'
    ) {
      return '.zip';
    } else {
      return '';
    }
  }

  /**
   * 从文件名中提取扩展名
   * @param fileName 文件名
   * @returns 文件扩展名
   */
  static getFileExtension(fileName: string): string {
    return extname(fileName);
  }

  /**
   * 确定最终的文件扩展名
   * @param fileName 文件名
   * @param contentType Content-Type头
   * @param buffer 文件内容缓冲区
   * @returns 最终的文件扩展名
   */
  static determineFileExtension(
    fileName: string,
    contentType: string,
    buffer: Buffer,
  ): string {
    // 首先尝试从文件名中提取扩展名
    let finalExt = this.getFileExtension(fileName);

    // 如果没有扩展名，根据Content-Type推断
    if (!finalExt) {
      finalExt = this.getFileTypeFromContentType(contentType);

      // 如果Content-Type也无法确定，根据文件内容判断
      if (!finalExt) {
        finalExt = this.getFileTypeFromBuffer(buffer);
      }
    }

    return finalExt;
  }
}
