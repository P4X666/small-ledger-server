const AdmZip = require('adm-zip');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

async function testUnzip() {
  console.log('测试解压ZIP文件...');
  
  try {
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
    
    console.log('开始解压ZIP文件...');
    
    // 创建临时目录用于存放解压后的文件
    const tempDir = join(__dirname, `temp_${Date.now()}`);
    console.log('创建临时目录:', tempDir);
    
    // 创建临时目录
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // 解压zip文件
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(tempDir, true);
    console.log('ZIP文件解压完成');
    
    // 查找CSV文件
    console.log('开始查找CSV文件...');
    const csvFiles = findCsvFiles(tempDir);
    console.log(`找到 ${csvFiles.length} 个CSV文件`);
    
    for (const csvFile of csvFiles) {
      console.log('\n处理CSV文件:', csvFile);
      
      // 读取CSV文件内容
      try {
        console.log('读取CSV文件内容...');
        const csvContent = readFileSync(csvFile, 'utf8');
        console.log('CSV文件内容长度:', csvContent.length, '字节');
        
        // 打印CSV文件的前几行
        const lines = csvContent.split('\n');
        console.log(`CSV文件共有 ${lines.length} 行`);
        console.log('CSV文件前10行内容:');
        for (let i = 0; i < Math.min(10, lines.length); i++) {
          console.log(`第 ${i + 1} 行: ${lines[i]}`);
        }
        
      } catch (error) {
        console.error('读取CSV文件失败:', error.message);
      }
    }
    
    // 清理临时文件
    console.log('\n清理临时目录:', tempDir);
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('临时目录清理完成');
    
  } catch (error) {
    console.error('测试脚本执行失败:', error.message);
    console.error(error.stack);
  }
}

/**
 * 查找目录中的所有CSV文件
 */
function findCsvFiles(directory) {
  const csvFiles = [];
  const fs = require('fs');
  
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = join(directory, file.name);
    
    if (file.isDirectory()) {
      // 递归查找子目录
      csvFiles.push(...findCsvFiles(fullPath));
    } else if (fullPath.toLowerCase().endsWith('.csv')) {
      csvFiles.push(fullPath);
    }
  }
  
  return csvFiles;
}

// 运行测试
testUnzip().catch(console.error);
