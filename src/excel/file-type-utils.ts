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
      if (header === '504b0304' || header === '504b0506' || header === '504b0708') {
        // 是ZIP文件
        // 进一步检查是否为Excel文件（xlsx文件是特殊的ZIP文件，包含特定结构）
        if (buffer.length >= 1000) { // 增加缓冲区大小要求，确保能读取到更多内容
          // 尝试读取ZIP文件的条目名称
          // 注意：这是一个简化的检查，实际的ZIP文件结构更复杂
          try {
            // 查找ZIP文件中的条目
            let offset = 0;
            while (offset < buffer.length - 20) {
              const localFileHeader = buffer.toString('hex', offset, offset + 4);
              if (localFileHeader === '504b0304') {
                // 找到了本地文件头
                // 跳过文件头的前30个字节，到达文件名长度字段
                if (offset + 30 < buffer.length) {
                  const fileNameLength = buffer.readUInt16LE(offset + 26);
                  const extraFieldLength = buffer.readUInt16LE(offset + 28);
                  if (offset + 30 + fileNameLength + extraFieldLength < buffer.length) {
                    const fileName = buffer.toString('utf8', offset + 30, offset + 30 + fileNameLength);
                    // 检查文件名是否包含Excel文件的特征路径
                    if (fileName.includes('xl/') || fileName.includes('XL/')) {
                      return '.xlsx';
                    }
                  }
                }
                // 跳过当前条目，继续查找下一个条目
                offset += 30; // 本地文件头固定长度
                if (offset + 4 < buffer.length) {
                  const fileNameLength = buffer.readUInt16LE(offset - 4);
                  const extraFieldLength = buffer.readUInt16LE(offset - 2);
                  offset += fileNameLength + extraFieldLength;
                  // 跳过文件内容（这里简化处理，实际需要读取文件大小字段）
                } else {
                  break;
                }
              } else {
                offset++;
              }
            }
          } catch {
            // 解析失败，默认为普通ZIP文件
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
      contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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
  static determineFileExtension(fileName: string, contentType: string, buffer: Buffer): string {
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
