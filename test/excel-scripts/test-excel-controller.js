const { ExcelService } = require('../../dist/excel/excel.service');
const { ExcelController } = require('../../dist/excel/excel.controller');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

async function testExcelController() {
  console.log('测试Excel控制器处理流程...');
  
  // 初始化服务
  const excelService = new ExcelService();
  const excelController = new ExcelController(excelService);
  
  // 测试文件路径
  const sourceDir = join(__dirname, '../../source');
  const testFiles = [
    join(sourceDir, '微信支付账单流水文件(20260112-20260116)_20260116210056.xlsx')
  ];
  
  // 清空bill.json文件
  const billJsonPath = join(__dirname, '../../bill.json');
  console.log('清空bill.json文件...');
  writeFileSync(billJsonPath, JSON.stringify({ income: [], expense: [], neutral: [] }, null, 2), 'utf8');
  
  for (const filePath of testFiles) {
    console.log(`\n处理文件: ${filePath}`);
    try {
      // 模拟文件对象
      const mockFile = {
        path: filePath,
        originalname: filePath.substring(filePath.lastIndexOf('/') + 1),
        size: readFileSync(filePath).length
      };
      
      // 直接调用uploadFile方法
      const result = await excelController.uploadFile(mockFile);
      console.log('处理结果:', result);
      
    } catch (error) {
      console.error(`处理失败: ${error.message}`);
      console.error(error.stack);
    }
  }
  
  // 读取并验证bill.json文件
  console.log('\n验证bill.json文件内容...');
  try {
    const billJsonContent = readFileSync(billJsonPath, 'utf8');
    const billData = JSON.parse(billJsonContent);
    
    console.log('bill.json文件结构验证:');
    console.log(`- income数组长度: ${billData.income.length}`);
    console.log(`- expense数组长度: ${billData.expense.length}`);
    console.log(`- neutral数组长度: ${billData.neutral.length}`);
    
    // 打印部分数据示例
    if (billData.expense.length > 0) {
      console.log('支出数据示例:', JSON.stringify(billData.expense[0], null, 2));
    }
    
    // 检查乱码
    console.log('\n乱码检查:');
    const hasInvalidChars = (str) => /[\ufffd]/.test(str);
    let invalidCharsFound = false;
    
    for (const item of billData.expense) {
      for (const key in item) {
        if (typeof item[key] === 'string' && hasInvalidChars(item[key])) {
          console.error(`支出数据中发现乱码: ${key}: ${item[key]}`);
          invalidCharsFound = true;
        }
      }
    }
    
    if (!invalidCharsFound) {
      console.log('未发现乱码，编码处理正确');
    }
    
  } catch (error) {
    console.error(`读取bill.json文件失败: ${error.message}`);
  }
}

// 运行测试
testExcelController().catch(console.error);
