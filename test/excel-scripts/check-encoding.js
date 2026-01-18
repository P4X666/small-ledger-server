const { readFileSync } = require('fs');
const { join } = require('path');
const chardet = require('chardet');
const iconv = require('iconv-lite');

function checkFileEncoding() {
  console.log('检查文件编码...');
  
  // 测试文件路径
  const sourceDir = join(__dirname, '../../source');
  const testFiles = [
    join(sourceDir, 'alipay_record_20260116_2102.zip'),
    join(sourceDir, '微信支付账单流水文件(20260112-20260116)_20260116210056.xlsx')
  ];
  
  for (const filePath of testFiles) {
    console.log(`\n检查文件: ${filePath}`);
    try {
      // 读取文件内容
      const buffer = readFileSync(filePath);
      
      // 检测编码
      const detectedEncoding = chardet.detect(buffer);
      console.log('检测到的编码:', detectedEncoding);
      
      // 尝试读取文件头部
      const headerBuffer = buffer.slice(0, 1000);
      console.log('文件头部（十六进制）:', headerBuffer.toString('hex').substring(0, 100));
      
      // 尝试使用不同编码解码
      const encodingsToTry = ['utf8', 'gbk', 'gb2312', 'iso-8859-1'];
      for (const encoding of encodingsToTry) {
        try {
          if (iconv.encodingExists(encoding)) {
            const decoded = iconv.decode(headerBuffer, encoding);
            console.log(`\n使用${encoding}解码:`);
            console.log(decoded.substring(0, 500));
          }
        } catch (error) {
          console.log(`使用${encoding}解码失败:`, error.message);
        }
      }
      
    } catch (error) {
      console.error(`检查失败: ${error.message}`);
    }
  }
}

// 运行检查
checkFileEncoding();
