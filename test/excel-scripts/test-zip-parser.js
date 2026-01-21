const { ExcelService } = require('../../dist/excel/excel.service');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

async function testZipParser() {
  console.log('测试ZIP文件解析...');
  
  try {
    // 初始化服务
    console.log('初始化服务...');
    const excelService = new ExcelService();
    console.log('服务初始化完成');
    
    // 测试文件路径
    const sourceDir = join(__dirname, '../../source');
    const zipFilePath = join(sourceDir, 'alipay_record_20260116_2102.zip');
    console.log('测试文件路径:', zipFilePath);
    
    // 检查文件是否存在
    const fs = require('fs');
    if (!fs.existsSync(zipFilePath)) {
      console.error('文件不存在:', zipFilePath);
      return;
    }
    
    // 读取文件大小
    const fileStats = fs.statSync(zipFilePath);
    console.log('文件大小:', fileStats.size, '字节');
    
    console.log('开始解析ZIP文件...');
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('解析文件超时'));
      }, 30000); // 30秒超时
    });
    
    // 并行执行解析和超时检查
    try {
      // 直接使用ExcelService解析文件
      const result = await Promise.race([
        excelService.parse(zipFilePath, { skipRows: 3 }),
        timeoutPromise
      ]);
      console.log('解析结果:', result);
    } catch (error) {
      console.error('解析失败:', error.message);
      console.error(error.stack);
    }
    
  } catch (error) {
    console.error('测试脚本执行失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testZipParser().catch(console.error);
