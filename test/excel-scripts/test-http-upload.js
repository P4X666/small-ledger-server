const request = require('supertest');
const { writeFileSync, readFileSync, unlinkSync } = require('fs');
const { join } = require('path');

// 导入应用实例
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../../dist/app.module');

async function testHttpUpload() {
  console.log('测试HTTP上传Excel文件...');
  
  // 创建应用实例
  const app = await NestFactory.create(AppModule);
  
  try {
    // 测试文件路径
    const sourceDir = join(__dirname, '../../source');
    const testFiles = [
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
    
    for (const filePath of testFiles) {
      console.log(`\n处理文件: ${filePath}`);
      
      // 读取文件内容
      const fileContent = readFileSync(filePath);
      const fileName = filePath.substring(filePath.lastIndexOf('\\') + 1);
      
      // 测试1: 普通表单上传
      console.log('测试1: 普通表单上传');
      const formUploadResult = await request(app.getHttpServer())
        .post('/excel/upload')
        .attach('file', fileContent, fileName)
        .expect(201);
      
      console.log('表单上传结果:', formUploadResult.body);
      
      // 测试2: Binary格式上传（模拟某些客户端的上传方式）
      console.log('测试2: Binary格式上传');
      const binaryUploadResult = await request(app.getHttpServer())
        .post('/excel/upload')
        .set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .set('Content-Disposition', `attachment; filename="${fileName}"`)
        .send(fileContent)
        .expect(201);
      
      console.log('Binary上传结果:', binaryUploadResult.body);
    }
    
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
    
  } finally {
    // 关闭应用
    await app.close();
  }
}

// 运行测试
testHttpUpload().catch(console.error);
