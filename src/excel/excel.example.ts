import { ExcelService } from './excel.service';
import { ExampleValidator } from './validators/example.validator';

// 创建Excel服务实例
const excelService = new ExcelService();

const xlsxFilePath =
  './source/微信支付账单流水文件(20260112-20260116)_20260116210056.xlsx';
const csvFilePath = './source/alipay_record_20260116_2050_1.csv';

// 示例1：解析Excel文件
async function parseExcelFile() {
  try {
    const result = await excelService.parse(xlsxFilePath, {
      sheetName: 'Sheet1', // 指定工作表名称
      skipHeader: false, // 不跳过表头
    });

    console.log('Excel文件解析结果:');
    console.log(`文件类型: ${result.fileType}`);
    console.log(`总行数: ${result.totalRows}`);
    console.log(`解析耗时: ${result.parseTime}ms`);
    console.log('前5行数据:');
    console.log(result.data.slice(0, 5));

    return result;
  } catch (error) {
    console.error('解析Excel文件失败:', error.message);
    return null;
  }
}

// 示例2：解析CSV文件
async function parseCsvFile() {
  try {
    const result = await excelService.parse(csvFilePath, {
      encoding: 'utf8', // 指定编码
    });

    console.log('\nCSV文件解析结果:');
    console.log(`文件类型: ${result.fileType}`);
    console.log(`总行数: ${result.totalRows}`);
    console.log(`解析耗时: ${result.parseTime}ms`);
    console.log('前5行数据:');
    console.log(result.data.slice(0, 5));

    return result;
  } catch (error) {
    console.error('解析CSV文件失败:', error.message);
    return null;
  }
}

// 示例3：验证数据
async function validateData() {
  try {
    const result = await excelService.parse(xlsxFilePath);

    if (result) {
      const validator = new ExampleValidator();
      const validationResult = excelService.validateData(
        result.data,
        validator,
      );

      console.log('\n数据验证结果:');
      console.log(`验证通过: ${validationResult.valid}`);
      if (!validationResult.valid) {
        console.log('验证错误:');
        validationResult.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
      }
    }
  } catch (error) {
    console.error('验证数据失败:', error.message);
  }
}

// 示例4：批量解析文件
async function batchParseFiles() {
  try {
    const files = [xlsxFilePath, csvFilePath];

    const results = await excelService.batchParse(files);

    console.log('\n批量解析结果:');
    results.forEach((result, index) => {
      console.log(`\n文件 ${index + 1}:`);
      console.log(`文件类型: ${result.fileType}`);
      console.log(`总行数: ${result.totalRows}`);
      console.log(`解析耗时: ${result.parseTime}ms`);
    });
  } catch (error) {
    console.error('批量解析文件失败:', error.message);
  }
}

// 运行示例
async function runExamples() {
  console.log('开始运行Excel服务示例...');

  try {
    await parseExcelFile();
    await parseCsvFile();
    await validateData();
    await batchParseFiles();

    console.log('\n示例运行完成!');
  } catch (error) {
    console.error('示例运行失败:', error.message);
  }
}

// 调用运行示例函数
runExamples().catch((error) => {
  console.error('运行示例时发生错误:', error.message);
});

// 导出示例函数
export {
  runExamples,
  parseExcelFile,
  parseCsvFile,
  validateData,
  batchParseFiles,
};
