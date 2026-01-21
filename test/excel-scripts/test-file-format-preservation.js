const { ExcelService } = require('../../dist/excel/excel.service');
const { ExcelController } = require('../../dist/excel/excel.controller');
const { writeFileSync, readFileSync, unlinkSync, copyFileSync } = require('fs');
const { join, extname } = require('path');

async function testFileFormatPreservation() {
  console.log('测试文件格式保持功能...');
  
  try {
    // 初始化服务
    console.log('初始化服务...');
    const excelService = new ExcelService();
    const excelController = new ExcelController(excelService);
    console.log('服务初始化完成');
    
    // 测试文件路径
    const sourceDir = join(__dirname, '../../source');
    const testFiles = [
      join(sourceDir, 'alipay_record_20260116_2102.zip'),
      join(sourceDir, '微信支付账单流水文件(20260112-20260116)_20260116210056.xlsx')
    ];
    
    // 清空uploads目录
    const uploadsDir = join(__dirname, '../../uploads');
    const fs = require('fs');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        unlinkSync(join(uploadsDir, file));
      }
      console.log('已清空uploads目录');
    }
    
    // 清空bill.json文件
    const billJsonPath = join(__dirname, '../../bill.json');
    console.log('清空bill.json文件...');
    writeFileSync(billJsonPath, JSON.stringify({ income: [], expense: [], neutral: [] }, null, 2), 'utf8');
    
    console.log(`找到 ${testFiles.length} 个测试文件`);
    
    for (const filePath of testFiles) {
      console.log(`\n处理文件: ${filePath}`);
      try {
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
          console.error(`文件不存在: ${filePath}`);
          continue;
        }
        
        // 读取文件大小
        const fileStats = fs.statSync(filePath);
        console.log(`文件大小: ${fileStats.size} 字节`);
        
        // 确保uploads目录存在
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // 生成随机文件名
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        const ext = extname(filePath);
        const fileName = `${randomName}${ext}`;
        const destPath = join(uploadsDir, fileName);
        
        // 复制文件到uploads目录
        fs.copyFileSync(filePath, destPath);
        console.log(`文件已复制到: ${destPath}`);
        
        // 模拟文件对象（更接近multer生成的格式）
        const mockFile = {
          fieldname: 'file',
          originalname: filePath.substring(filePath.lastIndexOf('\\') + 1),
          encoding: '7bit',
          mimetype: filePath.endsWith('.zip') ? 'application/zip' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          destination: './uploads',
          filename: fileName,
          path: destPath,
          size: fileStats.size
        };
        
        console.log('上传前文件扩展名:', mockFile.originalname.substring(mockFile.originalname.lastIndexOf('.')));
        
        // 设置超时
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('处理文件超时'));
          }, 30000); // 30秒超时
        });
        
        // 保存原始扩展名用于后续检查
        const originalExt = extname(mockFile.originalname).toLowerCase();
        
        // 并行执行处理和超时检查
        try {
          console.log('开始处理文件...');
          const result = await Promise.race([
            excelController.uploadFile(mockFile),
            timeoutPromise
          ]);
          console.log('处理结果:', result);
          
        } catch (error) {
          console.error('处理失败:', error.message);
          console.error(error.stack);
        }
        
        // 检查uploads目录中的文件（针对当前处理的文件）
        console.log('\n检查uploads目录中的文件:');
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir);
          console.log(`uploads目录中有 ${files.length} 个文件:`);
          
          for (const file of files) {
            console.log(`- ${file}`);
            // 检查文件扩展名是否与原始文件一致
            const currentExt = extname(file).toLowerCase();
            
            // 找到与当前处理的文件相关的上传文件（通过随机前缀匹配）
            if (file.includes(randomName)) {
              if (currentExt === originalExt) {
                console.log(`  ✓ 文件扩展名正确保持: ${currentExt}`);
              } else {
                console.log(`  ✗ 文件扩展名错误: ${currentExt}，应该是${originalExt}`);
              }
            }
          }
        } else {
          console.log('uploads目录不存在');
        }
        
      } catch (error) {
        console.error('处理文件时出错:', error.message);
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
    console.error('测试脚本执行失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testFileFormatPreservation().catch(console.error);
