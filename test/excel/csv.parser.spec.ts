import { Test, TestingModule } from '@nestjs/testing';
import { CsvParser } from '../../src/excel/csv.parser';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import iconv from 'iconv-lite';

describe('CsvParser', () => {
  let parser: CsvParser;
  let testDir: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvParser],
    }).compile();

    parser = module.get<CsvParser>(CsvParser);
    testDir = join(__dirname, 'test-files', 'csv-encoding');

    // 创建测试目录
    try {
      mkdirSync(testDir, { recursive: true });
    } catch {}
  });

  afterEach(() => {
    // 清理测试文件
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  describe('parse', () => {
    it('should parse UTF-8 encoded CSV file successfully', async () => {
      const csvContent =
        'name,amount,date\n测试,100,2024-01-01\nTest,200,2024-01-02';
      const csvPath = join(testDir, 'utf8.csv');
      writeFileSync(csvPath, csvContent, 'utf8');

      const result = await parser.parse(csvPath);
      expect(result).toBeDefined();
      expect(result.fileType).toBe('csv');
      expect(result.data).toHaveLength(2);
      expect(result.totalRows).toBe(2); // only data rows, not including header
      expect(result.data[0].name).toBe('测试');
      expect(result.data[1].name).toBe('Test');
    });

    it('should parse UTF-8 with BOM encoded CSV file successfully', async () => {
      const csvContent =
        'name,amount,date\n测试,100,2024-01-01\nTest,200,2024-01-02';
      const csvPath = join(testDir, 'utf8-bom.csv');
      // 添加BOM
      const bomContent = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from(csvContent, 'utf8'),
      ]);
      writeFileSync(csvPath, bomContent);

      const result = await parser.parse(csvPath);
      expect(result).toBeDefined();
      expect(result.fileType).toBe('csv');
      expect(result.data).toHaveLength(2);
      expect(result.totalRows).toBe(2);
      expect(result.data[0].name).toBe('测试');
    });

    it('should parse GBK encoded CSV file successfully', async () => {
      const csvContent =
        'name,amount,date\n测试,100,2024-01-01\nTest,200,2024-01-02';
      const csvPath = join(testDir, 'gbk.csv');
      // 使用GBK编码写入
      const gbkBuffer = iconv.encode(csvContent, 'gbk');
      writeFileSync(csvPath, gbkBuffer);

      const result = await parser.parse(csvPath);
      expect(result).toBeDefined();
      expect(result.fileType).toBe('csv');
      expect(result.data).toHaveLength(2);
      expect(result.totalRows).toBe(2);
      expect(result.data[0].name).toBe('测试');
    });

    it('should parse GB2312 encoded CSV file successfully', async () => {
      const csvContent =
        'name,amount,date\n测试,100,2024-01-01\nTest,200,2024-01-02';
      const csvPath = join(testDir, 'gb2312.csv');
      // 使用GB2312编码写入
      const gb2312Buffer = iconv.encode(csvContent, 'gb2312');
      writeFileSync(csvPath, gb2312Buffer);

      const result = await parser.parse(csvPath);
      expect(result).toBeDefined();
      expect(result.fileType).toBe('csv');
      expect(result.data).toHaveLength(2);
      expect(result.totalRows).toBe(2);
      expect(result.data[0].name).toBe('测试');
    });

    it('should parse ISO-8859-1 encoded CSV file successfully', async () => {
      const csvContent =
        'name,amount,date\nTest,100,2024-01-01\nTest2,200,2024-01-02';
      const csvPath = join(testDir, 'iso-8859-1.csv');
      // 使用ISO-8859-1编码写入
      const isoBuffer = iconv.encode(csvContent, 'iso-8859-1');
      writeFileSync(csvPath, isoBuffer);

      const result = await parser.parse(csvPath);
      expect(result).toBeDefined();
      expect(result.fileType).toBe('csv');
      expect(result.data).toHaveLength(2);
      expect(result.totalRows).toBe(2);
      expect(result.data[0].name).toBe('Test');
    });

    it('should handle file not found error', async () => {
      const nonExistentPath = join(testDir, 'non-existent.csv');
      await expect(parser.parse(nonExistentPath)).rejects.toThrow(
        `文件不存在: ${nonExistentPath}`,
      );
    });

    it('should handle skipRows option correctly', async () => {
      const csvContent =
        'skip1,skip2,skip3\nheader1,header2,header3\ntest1,test2,test3';
      const csvPath = join(testDir, 'skip-rows.csv');
      writeFileSync(csvPath, csvContent, 'utf8');

      const result = await parser.parse(csvPath, { skipRows: 1 });
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].header1).toBe('test1');
    });
  });

  describe('validateFormat', () => {
    // it('should return true for valid CSV file', async () => {
    //   const csvContent = 'name,amount,date\nTest,100,2024-01-01';
    //   const csvPath = join(testDir, 'valid.csv');
    //   writeFileSync(csvPath, csvContent, 'utf8');

    //   const result = await parser.validateFormat(csvPath);
    //   expect(result).toBe(true);
    // });

    it('should return false for empty CSV file', async () => {
      const csvPath = join(testDir, 'empty.csv');
      writeFileSync(csvPath, '', 'utf8');

      const result = await parser.validateFormat(csvPath);
      expect(result).toBe(false);
    });

    it('should return false for file without commas', async () => {
      const csvContent = 'name amount date\nTest 100 2024-01-01';
      const csvPath = join(testDir, 'no-commas.csv');
      writeFileSync(csvPath, csvContent, 'utf8');

      const result = await parser.validateFormat(csvPath);
      expect(result).toBe(false);
    });

    it('should return false for non-existent file', async () => {
      const nonExistentPath = join(testDir, 'non-existent.csv');
      const result = await parser.validateFormat(nonExistentPath);
      expect(result).toBe(false);
    });
  });

  describe('supportedExtensions', () => {
    it('should return correct supported extensions', () => {
      const extensions = parser.supportedExtensions;
      expect(extensions).toEqual(['.csv']);
    });
  });
});
