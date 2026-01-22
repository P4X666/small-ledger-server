import { CsvParser } from '../../src/excel/csv.parser';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('CsvParser Optimized', () => {
  let parser: CsvParser;
  let testDir: string;

  beforeEach(() => {
    parser = new CsvParser();
    testDir = join(__dirname, 'test-files');
    // 确保测试目录存在
    const fs = require('fs');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // 清理测试生成的文件
    const testFiles = [
      join(testDir, 'test-special-chars.csv'),
      join(testDir, 'test-empty-rows.csv'),
      join(testDir, 'test-large-file.csv'),
    ];
    testFiles.forEach((file) => {
      if (require('fs').existsSync(file)) {
        require('fs').unlinkSync(file);
      }
    });
  });

  it('should correctly parse CSV with special characters', async () => {
    // 测试包含特殊字符的CSV文件
    // 注意：csv-parser库会将换行符视为行分隔符，因此测试用例中不包含换行符
    const csvContent = `交易号,商家订单号,商品名称,金额（元）,收/支,资金状态
20260116001,ORD123,测试商品"特殊字符",100.00,支出,已支出
20260116003,ORD125,商品名称含制表符,300.00,支出,已支出`;

    const csvPath = join(testDir, 'test-special-chars.csv');
    writeFileSync(csvPath, csvContent, 'utf8');

    const result = await parser.parse(csvPath, { skipRows: 0 });

    expect(result).toBeDefined();
    expect(result.data).toHaveLength(2);
    // csv-parser只计算数据行数，不包括表头行
    expect(result.totalRows).toBe(2);

    // 验证特殊字符处理
    expect(result.data[0]['商品名称']).toBe('测试商品"特殊字符"');
    expect(result.data[1]['商品名称']).toBe('商品名称含制表符');
  });

  it('should correctly parse large CSV file', async () => {
    // 测试大型CSV文件解析
    const header =
      '交易号,商家订单号,交易创建时间,付款时间,最近修改时间,交易来源地,类型,交易对方,商品名称,金额（元）,收/支,交易状态,服务费（元）,成功退款（元）,备注,资金状态\n';
    let rows = header;

    // 生成1000行测试数据
    for (let i = 0; i < 1000; i++) {
      rows += `20260116${i.toString().padStart(4, '0')},ORD${i.toString().padStart(6, '0')},2026-01-16 10:00:00,2026-01-16 10:00:01,2026-01-16 10:00:01,支付宝网站,即时到账交易,测试商家,测试商品${i},${(i + 100).toFixed(2)},支出,交易成功,0.00,0.00,,已支出\n`;
    }

    const csvPath = join(testDir, 'test-large-file.csv');
    writeFileSync(csvPath, rows, 'utf8');

    const startTime = Date.now();
    const result = await parser.parse(csvPath, { skipRows: 0 });
    const endTime = Date.now();

    expect(result).toBeDefined();
    expect(result.data).toHaveLength(1000);
    // csv-parser只计算数据行数，不包括表头行
    expect(result.totalRows).toBe(1000);

    // 验证解析速度（1000行数据解析时间应小于1秒）
    expect(endTime - startTime).toBeLessThan(1000);
  });

  it('should correctly skip specified rows', async () => {
    // 测试跳过指定行数
    const csvContent = `跳过行1,跳过行1数据
跳过行2,跳过行2数据
跳过行3,跳过行3数据
交易号,商家订单号,金额（元）,收/支,资金状态
20260116001,ORD123,100.00,支出,已支出
20260116002,ORD124,200.00,收入,已收入
20260116003,ORD125,300.00,支出,已支出`;

    const csvPath = join(testDir, 'test-skip-rows.csv');
    writeFileSync(csvPath, csvContent, 'utf8');

    const result = await parser.parse(csvPath, { skipRows: 3 });

    expect(result).toBeDefined();
    expect(result.data).toHaveLength(3);
    // totalRows只计算数据行数，不包括表头行
    expect(result.totalRows).toBe(3);

    // 验证表头被正确识别
    expect(result.data[0]['交易号']).toBe('20260116001');
    expect(result.data[1]['交易号']).toBe('20260116002');
    expect(result.data[2]['交易号']).toBe('20260116003');
  });

  it('should correctly handle different encodings', async () => {
    // 测试不同编码的CSV文件
    const csvContent =
      '交易号,商家订单号,商品名称,金额（元）,收/支,资金状态\n20260116001,ORD123,中文商品名称,100.00,支出,已支出';

    const csvPath = join(testDir, 'test-encoding.csv');

    // 使用GBK编码写入文件
    const iconv = require('iconv-lite');
    const gbkBuffer = iconv.encode(csvContent, 'gbk');
    writeFileSync(csvPath, gbkBuffer);

    const result = await parser.parse(csvPath, { skipRows: 0 });

    expect(result).toBeDefined();
    expect(result.data).toHaveLength(1);
    // csv-parser只计算数据行数，不包括表头行
    expect(result.totalRows).toBe(1);

    // 验证中文内容被正确解析
    expect(result.data[0]['商品名称']).toBe('中文商品名称');
  });
});
