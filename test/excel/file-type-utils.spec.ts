import { FileTypeUtils } from '../../src/excel/file-type-utils';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('FileTypeUtils', () => {
  describe('getFileTypeFromBuffer', () => {
    it('should return .zip for ZIP files', () => {
      // 读取测试ZIP文件
      const zipFilePath = join(__dirname, 'test-files', 'test.zip');
      const zipBuffer = readFileSync(zipFilePath);
      const result = FileTypeUtils.getFileTypeFromBuffer(zipBuffer);
      expect(result).toBe('.zip');
    });

    it('should return .xlsx for Excel files', () => {
      // 读取测试Excel文件
      const xlsxFilePath = join(__dirname, 'test-files', 'test.xlsx');
      const xlsxBuffer = readFileSync(xlsxFilePath);
      const result = FileTypeUtils.getFileTypeFromBuffer(xlsxBuffer);
      expect(result).toBe('.xlsx');
    });

    it('should return .xlsx for unknown files', () => {
      // 创建一个未知类型的文件缓冲区
      const unknownBuffer = Buffer.from('Hello, world!');
      const result = FileTypeUtils.getFileTypeFromBuffer(unknownBuffer);
      expect(result).toBe('.xlsx');
    });

    it('should return .xlsx for empty buffer', () => {
      // 创建一个空缓冲区
      const emptyBuffer = Buffer.alloc(0);
      const result = FileTypeUtils.getFileTypeFromBuffer(emptyBuffer);
      expect(result).toBe('.xlsx');
    });
  });

  describe('getFileTypeFromContentType', () => {
    it('should return .xlsx for Excel content types', () => {
      expect(FileTypeUtils.getFileTypeFromContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('.xlsx');
      expect(FileTypeUtils.getFileTypeFromContentType('application/excel')).toBe('.xlsx');
      expect(FileTypeUtils.getFileTypeFromContentType('application/spreadsheet')).toBe('.xlsx');
    });

    it('should return .csv for CSV content types', () => {
      expect(FileTypeUtils.getFileTypeFromContentType('text/csv')).toBe('.csv');
      expect(FileTypeUtils.getFileTypeFromContentType('application/csv')).toBe('.csv');
    });

    it('should return .zip for ZIP content types', () => {
      expect(FileTypeUtils.getFileTypeFromContentType('application/zip')).toBe('.zip');
      expect(FileTypeUtils.getFileTypeFromContentType('application/x-zip-compressed')).toBe('.zip');
      expect(FileTypeUtils.getFileTypeFromContentType('application/compressed')).toBe('.zip');
    });

    it('should return empty string for unknown content types', () => {
      expect(FileTypeUtils.getFileTypeFromContentType('application/octet-stream')).toBe('');
      expect(FileTypeUtils.getFileTypeFromContentType('text/plain')).toBe('');
    });
  });

  describe('getFileExtension', () => {
    it('should return correct extension for files with extension', () => {
      expect(FileTypeUtils.getFileExtension('file.xlsx')).toBe('.xlsx');
      expect(FileTypeUtils.getFileExtension('file.zip')).toBe('.zip');
      expect(FileTypeUtils.getFileExtension('file.csv')).toBe('.csv');
    });

    it('should return empty string for files without extension', () => {
      expect(FileTypeUtils.getFileExtension('file')).toBe('');
      expect(FileTypeUtils.getFileExtension('')).toBe('');
    });
  });

  describe('determineFileExtension', () => {
    it('should return extension from filename if present', () => {
      const buffer = Buffer.from('Hello, world!');
      expect(FileTypeUtils.determineFileExtension('file.xlsx', 'application/octet-stream', buffer)).toBe('.xlsx');
      expect(FileTypeUtils.determineFileExtension('file.zip', 'application/octet-stream', buffer)).toBe('.zip');
    });

    it('should use content type if filename has no extension', () => {
      const buffer = Buffer.from('Hello, world!');
      expect(FileTypeUtils.determineFileExtension('file', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer)).toBe('.xlsx');
      expect(FileTypeUtils.determineFileExtension('file', 'application/zip', buffer)).toBe('.zip');
    });

    it('should use buffer content if both filename and content type are not helpful', () => {
      // 读取测试ZIP文件
      const zipFilePath = join(__dirname, 'test-files', 'test.zip');
      const zipBuffer = readFileSync(zipFilePath);
      expect(FileTypeUtils.determineFileExtension('file', 'application/octet-stream', zipBuffer)).toBe('.zip');

      // 读取测试Excel文件
      const xlsxFilePath = join(__dirname, 'test-files', 'test.xlsx');
      const xlsxBuffer = readFileSync(xlsxFilePath);
      expect(FileTypeUtils.determineFileExtension('file', 'application/octet-stream', xlsxBuffer)).toBe('.xlsx');
    });
  });
});
