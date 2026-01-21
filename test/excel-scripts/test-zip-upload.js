const { ExcelService } = require('../../dist/excel/excel.service');
const { ExcelController } = require('../../dist/excel/excel.controller');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

async function testZipUpload() {
  console.log('测试ZIP格式上传Excel文件...');
  
  try {
    // 初始化服务
    const excelService = new ExcelService();
    const excelController = new ExcelController(excelService);
    
    // 测试文件路径
    const sourceDir = join(__dirname, '../../source');
    const testFiles = [
      join(sourceDir, 'alipay_record_20260116_2102.zip')
    ];
    
    // 清空bill.json文件
    const billJsonPath = join(__dirname, '../../bill.json');
    console.log('清空bill.json文件...');
    writeFileSync(billJsonPath, JSON.stringify({ income: [], expense: [], neutral: [] }, null, 2), 'utf8');
    
    console.log(`找到 ${testFiles.length} 个测试文件`);
    
    for (const filePath of testFiles) {
      console.log(`\n处理文件: ${filePath}`);
      try {
        // 检查文件是否存在
        const fs = require('fs');
        if (!fs.existsSync(filePath)) {
          console.error(`文件不存在: ${filePath}`);
          continue;
        }
        
        // 读取文件大小
        const fileStats = fs.statSync(filePath);
        console.log(`文件大小: ${fileStats.size} 字节`);
        
        // 模拟文件对象
        const mockFile = {
          path: filePath,
          originalname: filePath.substring(filePath.lastIndexOf('\\') + 1),
          size: fileStats.size
        };
        
        console.log('开始处理文件...');
        
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
      
    } catch (error) {
      console.error(`读取bill.json文件失败: ${error.message}`);
    }
  } catch (error) {
    console.error(`测试脚本执行失败: ${error.message}`);
    console.error(error.stack);
  }
}

// 运行测试
testZipUpload().catch(console.error);
