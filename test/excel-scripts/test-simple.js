const { ExcelService } = require('../../dist/excel/excel.service');
const { join } = require('path');

async function testSimple() {
  console.log('简单测试...');
  
  // 初始化服务
  const excelService = new ExcelService();
  
  // 测试文件路径
  const sourceDir = join(__dirname, '../../source');
  const xlsxFile = join(sourceDir, '微信支付账单流水文件(20260112-20260116)_20260116210056.xlsx');
  
  console.log('测试文件:', xlsxFile);
  
  try {
    // 解析文件
    const result = await excelService.parse(xlsxFile, { skipRows: 15 });
    console.log('解析结果:', {
      totalRows: result.totalRows,
      dataLength: result.data.length,
      parseTime: result.parseTime
    });
    
    // 打印前3条数据
    console.log('\n前3条数据:');
    for (let i = 0; i < Math.min(3, result.data.length); i++) {
      console.log(`数据 ${i+1}:`, JSON.stringify(result.data[i], null, 2));
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testSimple().catch(console.error);
