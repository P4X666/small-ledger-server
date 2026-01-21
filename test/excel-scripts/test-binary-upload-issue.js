const { ExcelService } = require('../../dist/excel/excel.service');
const { ExcelController } = require('../../dist/excel/excel.controller');
const { writeFileSync, readFileSync, unlinkSync } = require('fs');
const { join } = require('path');

async function testBinaryUploadIssue() {
  console.log('测试Binary格式上传问题...');
  
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
    
    // 读取文件内容
    const fileContent = fs.readFileSync(zipFilePath);
    console.log('文件大小:', fileContent.length, '字节');
    
    // 清空uploads目录
    const uploadsDir = join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      unlinkSync(join(uploadsDir, file));
    }
    console.log('已清空uploads目录');
    
    // 模拟Binary格式上传的请求对象
    const mockReq = {
      on: (event, callback) => {
        if (event === 'data') {
          callback(fileContent);
        } else if (event === 'end') {
          callback();
        } else if (event === 'error') {
          callback(new Error('Mock error'));
        }
      }
    };
    
    // 测试1: 使用错误的Content-Type上传zip文件（无文件名）
    console.log('\n测试1: 使用错误的Content-Type上传zip文件（无文件名）...');
    try {
      // 模拟Binary格式上传的请求对象（无文件名）
      const mockReqWithoutFilename = {
        on: (event, callback) => {
          if (event === 'data') {
            callback(fileContent);
          } else if (event === 'end') {
            callback();
          } else if (event === 'error') {
            callback(new Error('Mock error'));
          }
        }
      };
      
      const result = await excelController.uploadFile(
        null, // file参数为null，触发Binary格式上传处理
        mockReqWithoutFilename,
        'application/octet-stream', // 错误的Content-Type
        null // 无Content-Disposition头
      );
      console.log('上传结果:', result);
      
      // 检查uploads目录中的文件
      console.log('\n检查uploads目录中的文件:');
      const uploadFiles = fs.readdirSync(uploadsDir);
      console.log(`uploads目录中有 ${uploadFiles.length} 个文件:`);
      for (const file of uploadFiles) {
        console.log(`- ${file}`);
        // 检查文件扩展名
        if (file.endsWith('.xlsx')) {
          console.log(`  ✗ 文件被错误地保存为.xlsx扩展名`);
        } else if (file.endsWith('.zip')) {
          console.log(`  ✓ 文件正确保存为.zip扩展名`);
        } else {
          console.log(`  ? 文件扩展名未知: ${file.substring(file.lastIndexOf('.'))}`);
        }
      }
      
    } catch (error) {
      console.error('上传失败:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    
    // 清空uploads目录
    const files2 = fs.readdirSync(uploadsDir);
    for (const file of files2) {
      unlinkSync(join(uploadsDir, file));
    }
    console.log('\n已清空uploads目录');
    
    // 测试2: 使用正确的Content-Type上传zip文件
    console.log('\n测试2: 使用正确的Content-Type上传zip文件...');
    try {
      const result = await excelController.uploadFile(
        null, // file参数为null，触发Binary格式上传处理
        mockReq,
        'application/zip', // 正确的Content-Type
        `attachment; filename="alipay_record_20260116_2102.zip"` // 正确的文件名
      );
      console.log('上传结果:', result);
      
      // 检查uploads目录中的文件
      console.log('\n检查uploads目录中的文件:');
      const uploadFiles = fs.readdirSync(uploadsDir);
      console.log(`uploads目录中有 ${uploadFiles.length} 个文件:`);
      for (const file of uploadFiles) {
        console.log(`- ${file}`);
        // 检查文件扩展名
        if (file.endsWith('.xlsx')) {
          console.log(`  ✗ 文件被错误地保存为.xlsx扩展名`);
        } else if (file.endsWith('.zip')) {
          console.log(`  ✓ 文件正确保存为.zip扩展名`);
        } else {
          console.log(`  ? 文件扩展名未知: ${file.substring(file.lastIndexOf('.'))}`);
        }
      }
      
    } catch (error) {
      console.error('上传失败:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    
  } catch (error) {
    console.error('测试脚本执行失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testBinaryUploadIssue().catch(console.error);
