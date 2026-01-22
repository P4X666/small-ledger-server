const { ExcelService } = require('./dist/excel/excel.service');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

async function testCsvParser() {
  console.log('开始测试CSV解析逻辑...');
  
  try {
    // 创建ExcelService实例
    const excelService = new ExcelService();
    
    // 测试文件路径
    const testFilePath = join(__dirname, 'source', 'alipay_record_20260116_2102.zip');
    console.log('测试文件路径:', testFilePath);
    
    // 设置跳过行数（根据需求，zip中的CSV文件数据从第4行开始，需要跳过3行）
    const skipRows = 3;
    
    // 解析文件
    console.log('开始解析文件...');
    const parseResult = await excelService.parse(testFilePath, { skipRows });
    console.log('文件解析完成，解析了', parseResult.totalRows, '行数据');
    console.log('解析的数据示例:', parseResult.data.slice(0, 2));
    
    // 分类数据
    console.log('开始分类数据...');
    const categorizeTransactions = require('./dist/excel/excel.controller').ExcelController.prototype.categorizeTransactions;
    const categorizedData = categorizeTransactions.call({ excelService }, parseResult.data);
    console.log('数据分类完成，收入:', categorizedData.income.length, '条，支出:', categorizedData.expense.length, '条，中性:', categorizedData.neutral.length, '条');
    
    // 清理数据中的乱码
    const cleanData = (data) => {
      return data.map((item) => {
        const cleanedItem = {};
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            let value = item[key];
            if (typeof value === 'string') {
              // 移除控制字符
              value = value.replace(/[\u0000-\u001F\u007F]/g, '');
              // 移除零宽度字符
              value = value.replace(/[\u200B-\u200D\uFEFF]/g, '');
              // 清理乱码
              value = value.replace(/[\ufffd]/g, '');
            }
            cleanedItem[key] = value;
          }
        }
        return cleanedItem;
      });
    };
    
    // 清理数据
    const cleanIncome = cleanData(categorizedData.income);
    const cleanExpense = cleanData(categorizedData.expense);
    const cleanNeutral = cleanData(categorizedData.neutral);
    
    // 生成bill.json
    const billData = {
      income: cleanIncome,
      expense: cleanExpense,
      neutral: cleanNeutral
    };
    
    const outputPath = join(__dirname, 'bill.json');
    writeFileSync(outputPath, JSON.stringify(billData, null, 2), 'utf8');
    console.log('bill.json生成完成，路径:', outputPath);
    
    // 验证结果
    console.log('开始验证结果...');
    
    // 验证字段名是否正确
    if (cleanExpense.length > 0) {
      const firstExpense = cleanExpense[0];
      const expectedFields = ['交易号', '商家订单号', '交易创建时间', '付款时间', '最近修改时间', '交易来源地', '类型', '交易对方', '商品名称', '金额（元）', '收/支', '交易状态', '服务费（元）', '成功退款（元）', '备注', '资金状态'];
      const actualFields = Object.keys(firstExpense);
      
      console.log('预期字段:', expectedFields);
      console.log('实际字段:', actualFields);
      
      // 检查是否包含所有预期字段
      const missingFields = expectedFields.filter(field => !actualFields.includes(field));
      if (missingFields.length > 0) {
        console.error('缺少预期字段:', missingFields);
      } else {
        console.log('✓ 包含所有预期字段');
      }
      
      // 验证数据格式
      if (firstExpense['交易号']) {
        console.log('✓ 交易号字段存在');
      }
      if (firstExpense['金额（元）']) {
        console.log('✓ 金额字段存在');
      }
      if (firstExpense['资金状态']) {
        console.log('✓ 资金状态字段存在');
      }
    }
    
    console.log('测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCsvParser();
