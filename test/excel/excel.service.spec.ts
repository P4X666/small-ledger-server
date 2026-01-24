import { Test, TestingModule } from '@nestjs/testing';
import { ExcelService } from '../../src/excel/excel.service';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import AdmZip from 'adm-zip';

describe('ExcelService', () => {
  let service: ExcelService;
  let testDir: string;
  let validZipPath: string;
  let noCsvZipPath: string;
  let multipleCsvZipPath: string;
  let invalidZipPath: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelService],
    }).compile();

    service = module.get<ExcelService>(ExcelService);
    testDir = join(__dirname, 'test-files');

    // 创建测试目录
    try {
      mkdirSync(testDir, { recursive: true });
    } catch {}

    // 创建测试CSV文件
    const csvContent =
      'name,amount,date\nTest,100,2024-01-01\nTest2,200,2024-01-02';
    const csvPath = join(testDir, 'test.csv');
    writeFileSync(csvPath, csvContent);

    // 创建包含单个CSV文件的zip
    validZipPath = join(testDir, 'valid.zip');
    const validZip = new AdmZip();
    validZip.addLocalFile(csvPath);
    validZip.writeZip(validZipPath);

    // 创建不包含CSV文件的zip
    noCsvZipPath = join(testDir, 'no-csv.zip');
    const noCsvZip = new AdmZip();
    const txtPath = join(testDir, 'test.txt');
    writeFileSync(txtPath, 'test');
    noCsvZip.addLocalFile(txtPath);
    noCsvZip.writeZip(noCsvZipPath);

    // 创建包含多个CSV文件的zip
    multipleCsvZipPath = join(testDir, 'multiple-csv.zip');
    const multipleCsvZip = new AdmZip();
    multipleCsvZip.addLocalFile(csvPath);
    const csvPath2 = join(testDir, 'test2.csv');
    writeFileSync(csvPath2, csvContent);
    multipleCsvZip.addLocalFile(csvPath2);
    multipleCsvZip.writeZip(multipleCsvZipPath);

    // 创建无效的zip文件
    invalidZipPath = join(testDir, 'invalid.zip');
    writeFileSync(invalidZipPath, 'invalid zip content');
  });

  afterEach(() => {
    // 清理测试文件
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  describe('parse', () => {
    it('should parse zip file with single CSV successfully', async () => {
      const result = await service.parse(validZipPath);
      expect(result).toBeDefined();
      expect(result.fileType).toBe('csv');
      expect(result.data).toHaveLength(2);
      expect(result.totalRows).toBe(2); // only data rows, not including header
    });

    it('should throw error when zip file contains no CSV files', async () => {
      await expect(service.parse(noCsvZipPath)).rejects.toThrow(
        '文件格式无效:',
      );
    });

    it('should throw error when zip file contains multiple CSV files', async () => {
      await expect(service.parse(multipleCsvZipPath)).rejects.toThrow(
        '解析ZIP文件失败: ZIP文件中包含多个CSV文件，仅支持单个CSV文件，请确保压缩包中只包含一个账单文件',
      );
    });

    it('should throw error when zip file is invalid', async () => {
      await expect(service.parse(invalidZipPath)).rejects.toThrow(
        '文件格式无效:',
      );
    });

    it('should throw error when file does not exist', async () => {
      await expect(
        service.parse(join(testDir, 'non-existent.zip')),
      ).rejects.toThrow('文件格式无效:');
    });

    it('should throw error when file type is not supported', async () => {
      await expect(service.parse(join(testDir, 'test.txt'))).rejects.toThrow(
        '不支持的文件类型: .txt',
      );
    });
  });

  describe('validateFormat', () => {
    it('should return true for valid zip file with CSV', async () => {
      const result = await service.validateFormat(validZipPath);
      expect(result).toBe(true);
    });

    it('should return false for zip file without CSV', async () => {
      const result = await service.validateFormat(noCsvZipPath);
      expect(result).toBe(false);
    });

    it('should return false for invalid zip file', async () => {
      const result = await service.validateFormat(invalidZipPath);
      expect(result).toBe(false);
    });

    it('should return false for non-zip file', async () => {
      const result = await service.validateFormat(join(testDir, 'test.txt'));
      expect(result).toBe(false);
    });
  });
});
