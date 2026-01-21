const { ExcelService } = require('../../dist/excel/excel.service');
const { ExcelController } = require('../../dist/excel/excel.controller');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

async function testXlsxFormat() {
  console.log('测试XLSX格式文件上传...');
  
  try {
    // 初始化服务
    console.log('初始化服务...');
    const excelService = new ExcelService();
    const excelController = new ExcelController(excelService);
    console.log('服务初始化完成');
    
    // 测试文件路径
    const sourceDir = join(__dirname, '../../source');
    const xlsxFilePath = join(sourceDir, '微信支付账单流水文件(20260112-20260116)_20260116210056.xlsx');
    console.log('测试文件路径:', xlsxFilePath);
    
    // 检查文件是否存在
    const fs = require('fs');
    if (!fs.existsSync(xlsxFilePath)) {
      console.error('文件不存在:', xlsxFilePath);
      return;
    }
    
    // 读取文件大小
    const fileStats = fs.statSync(xlsxFilePath);
    console.log('文件大小:', fileStats.size, '字节');
    
    // 清空uploads目录
    const uploadsDir = join(__dirname, '../../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(join(uploadsDir, file));
      }
      console.log('已清空uploads目录');
    }
    
    // 清空bill.json文件
    const billJsonPath = join(__dirname, '../../bill.json');
    console.log('清空bill.json文件...');
    writeFileSync(billJsonPath, JSON.stringify({ income: [], expense: [], neutral: [] }, null, 2), 'utf8');
    
    // 模拟文件对象
    const mockFile = {
      path: xlsxFilePath,
      originalname: xlsxFilePath.substring(xlsxFilePath.lastIndexOf('\\') + 1),
      size: fileStats.size
    };
    
    console.log('开始上传文件...');
    console.log('上传前文件扩展名:', mockFile.originalname.substring(mockFile.originalname.lastIndexOf('.')));
    
    // 直接调用uploadFile方法
    const result = await excelController.uploadFile(mockFile);
    console.log('上传结果:', result);
    
    // 检查uploads目录中的文件
    console.log('\n检查uploads目录中的文件:');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`uploads目录中有 ${files.length} 个文件:`);
      for (const file of files) {
        console.log(`- ${file}`);
        // 检查文件扩展名是否为.xlsx
        const ext = file.substring(file.lastIndexOf('.'));
        if (ext === '.xlsx') {
          console.log(`  ✓ 文件扩展名正确: ${ext}`);
        } else {
          console.log(`  ✗ 文件扩展名错误: ${ext}，应该是.xlsx`);
        }
      }
    } else {
      console.log('uploads目录不存在');
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
    console.error('测试脚本执行失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testXlsxFormat().catch(console.error);
