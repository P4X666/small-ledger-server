const { ExcelService } = require('../../dist/excel/excel.service');
const { ExcelController } = require('../../dist/excel/excel.controller');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

async function testSimpleZipUpload() {
  console.log('测试ZIP格式上传Excel文件（简化版）...');
  
  try {
    // 初始化服务
    console.log('初始化服务...');
    const excelService = new ExcelService();
    const excelController = new ExcelController(excelService);
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
    
    // 模拟文件对象
    const mockFile = {
      path: zipFilePath,
      originalname: zipFilePath.substring(zipFilePath.lastIndexOf('\\') + 1),
      size: fileStats.size
    };
    
    console.log('开始处理文件...');
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('处理文件超时'));
      }, 30000); // 30秒超时
    });
    
    // 并行执行处理和超时检查
    try {
      const result = await Promise.race([
        excelController.uploadFile(mockFile),
        timeoutPromise
      ]);
      console.log('处理结果:', result);
    } catch (error) {
      console.error('处理失败:', error.message);
      console.error(error.stack);
    }
    
  } catch (error) {
    console.error('测试脚本执行失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testSimpleZipUpload().catch(console.error);
