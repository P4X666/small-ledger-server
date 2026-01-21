const { ExcelService } = require('../../dist/excel/excel.service');
const { ExcelController } = require('../../dist/excel/excel.controller');
const { writeFileSync, readFileSync, unlinkSync, copyFileSync } = require('fs');
const { join, extname } = require('path');

async function testZipUploadIssue() {
  console.log('测试ZIP文件上传问题...');
  
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
    console.log('文件扩展名:', extname(zipFilePath));
    
    // 确保uploads目录存在
    const uploadsDir = join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // 清空uploads目录
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      unlinkSync(join(uploadsDir, file));
    }
    console.log('已清空uploads目录');
    
    // 生成随机文件名
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    const ext = extname(zipFilePath);
    const fileName = `${randomName}${ext}`;
    const destPath = join(uploadsDir, fileName);
    
    // 复制文件到uploads目录
    fs.copyFileSync(zipFilePath, destPath);
    console.log(`文件已复制到: ${destPath}`);
    console.log(`目标文件扩展名: ${extname(destPath)}`);
    
    // 模拟文件对象（模拟multer生成的格式）
    const mockFile = {
      fieldname: 'file',
      originalname: 'alipay_record_20260116_2102.zip',
      encoding: '7bit',
      mimetype: 'application/zip',
      destination: './uploads',
      filename: fileName,
      path: destPath,
      size: fileStats.size
    };
    
    console.log('模拟文件对象:', {
      originalname: mockFile.originalname,
      filename: mockFile.filename,
      path: mockFile.path,
      mimetype: mockFile.mimetype
    });
    
    // 测试文件上传
    console.log('开始处理文件...');
    try {
      // 首先测试excelService.validateFormat方法
      console.log('测试excelService.validateFormat方法...');
      const isValid = await excelService.validateFormat(destPath);
      console.log('validateFormat结果:', isValid);
      
      // 尝试使用ZipParser直接验证
      console.log('尝试使用ZipParser直接验证...');
      const ZipParser = require('../../dist/excel/zip.parser').ZipParser;
      const zipParser = new ZipParser();
      const isZipValid = await zipParser.validateFormat(destPath);
      console.log('ZipParser验证结果:', isZipValid);
      
      // 尝试使用XlsxParser直接验证
      console.log('尝试使用XlsxParser直接验证...');
      const XlsxParser = require('../../dist/excel/xlsx.parser').XlsxParser;
      const xlsxParser = new XlsxParser();
      const isXlsxValid = await xlsxParser.validateFormat(destPath);
      console.log('XlsxParser验证结果:', isXlsxValid);
      
      // 检查文件扩展名和路径
      console.log('检查文件扩展名和路径:');
      console.log('文件路径:', destPath);
      console.log('文件扩展名:', extname(destPath));
      console.log('文件是否存在:', fs.existsSync(destPath));
      
    } catch (error) {
      console.error('处理失败:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    
  } catch (error) {
    console.error('测试脚本执行失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testZipUploadIssue().catch(console.error);
