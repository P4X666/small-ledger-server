const { ExcelService } = require('../../dist/excel/excel.service');
const { ExcelController } = require('../../dist/excel/excel.controller');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

async function testControllerIssue() {
  console.log('测试Excel控制器问题...');
  
  // 初始化服务
  const excelService = new ExcelService();
  const excelController = new ExcelController(excelService);
  
  // 测试文件路径
  const sourceDir = join(__dirname, '../../source');
  const xlsxFile = join(sourceDir, '微信支付账单流水文件(20260112-20260116)_20260116210056.xlsx');
  
  console.log('测试文件:', xlsxFile);
  
  try {
    // 1. 直接解析文件（正确的结果）
    console.log('\n1. 直接解析文件:');
    const parsedData = await excelService.parse(xlsxFile, { skipRows: 15 });
    console.log('原始数据前2条:');
    for (let i = 0; i < Math.min(2, parsedData.data.length); i++) {
      console.log(`数据 ${i+1}:`, JSON.stringify(parsedData.data[i], null, 2));
    }
    
    // 2. 测试分类方法
    console.log('\n2. 测试分类方法:');
    const categorizeMethod = excelController['categorizeTransactions'];
    if (typeof categorizeMethod === 'function') {
      const categorized = categorizeMethod.call(excelController, parsedData.data);
      console.log('分类结果:', {
        income: categorized.income.length,
        expense: categorized.expense.length,
        neutral: categorized.neutral.length
      });
      
      if (categorized.expense.length > 0) {
        console.log('分类后支出数据:', JSON.stringify(categorized.expense[0], null, 2));
      }
    }
    
    // 3. 测试清理方法
    console.log('\n3. 测试清理方法:');
    const cleanDataMethod = excelController['cleanData'];
    if (typeof cleanDataMethod === 'function') {
      const cleaned = cleanDataMethod.call(excelController, parsedData.data);
      console.log('清理后数据:', JSON.stringify(cleaned[0], null, 2));
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testControllerIssue().catch(console.error);
