const { ExcelService } = require('../../dist/excel/excel.service');
const { ExcelController } = require('../../dist/excel/excel.controller');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

async function testBillJsonGeneration() {
  console.log('开始测试bill.json生成...');
  
  // 初始化服务
  const excelService = new ExcelService();
  const excelController = new ExcelController(excelService);
  
  // 测试文件路径
  const sourceDir = join(__dirname, '../../source');
  const testFiles = [
    join(sourceDir, 'alipay_record_20260116_2102.zip'),
    join(sourceDir, '微信支付账单流水文件(20260112-20260116)_20260116210056.xlsx')
  ];
  
  // 清空bill.json文件
  const billJsonPath = join(__dirname, '../../bill.json');
  console.log('清空bill.json文件...');
  writeFileSync(billJsonPath, JSON.stringify({ income: [], expense: [], neutral: [] }, null, 2), 'utf8');
  
  // 模拟文件上传处理
  for (const filePath of testFiles) {
    console.log(`\n处理文件: ${filePath}`);
    try {
      // 直接调用解析和分类逻辑
      // 根据文件类型设置跳过行数
      const ext = filePath.substring(filePath.lastIndexOf('.'));
      let skipRows = 0;
      if (ext === '.xlsx' || ext === '.xls') {
        skipRows = 15; // Excel格式跳过15行
      } else if (ext === '.csv' || ext === '.zip') {
        skipRows = 4; // CSV和ZIP格式跳过4行
      }
      
      // 解析文件
      const parsedData = await excelService.parse(filePath, { skipRows });
      console.log(`解析成功: ${parsedData.totalRows}行数据, 耗时${parsedData.parseTime}ms`);
      console.log(`数据行数: ${parsedData.data.length}`);
      
      // 获取分类方法
      const categorizeMethod = excelController['categorizeTransactions'];
      if (typeof categorizeMethod === 'function') {
        // 分类数据
        const categorizedData = categorizeMethod.call(excelController, parsedData.data);
        console.log('分类结果:');
        console.log(`- 收入: ${categorizedData.income.length}`);
        console.log(`- 支出: ${categorizedData.expense.length}`);
        console.log(`- 中性: ${categorizedData.neutral.length}`);
        
        // 读取现有bill.json文件
        let existingData = { income: [], expense: [], neutral: [] };
        try {
          if (readFileSync(billJsonPath, 'utf8')) {
            existingData = JSON.parse(readFileSync(billJsonPath, 'utf8'));
          }
        } catch (error) {
          console.error('读取现有bill.json文件失败:', error.message);
        }
        
        // 清理数据函数
        const cleanData = (data) => {
          return data.map(item => {
            const cleanedItem = {};
            for (const key in item) {
              if (Object.prototype.hasOwnProperty.call(item, key)) {
                let value = item[key];
                if (typeof value === 'string') {
                  // 移除控制字符
                  value = value.replace(/[\x00-\x1F\x7F]/g, '');
                  // 移除零宽度字符
                  value = value.replace(/[\u200B-\u200D\uFEFF]/g, '');
                  // 清理乱码
                  const iconv = require('iconv-lite');
                  let result = value;
                  try {
                    if (/[\ufffd]/.test(value)) {
                      const buffer = Buffer.from(value, 'utf8');
                      result = iconv.decode(buffer, 'utf8');
                    }
                  } catch (e) {
                    // 忽略错误
                  }
                  try {
                    const buffer = Buffer.from(value, 'binary');
                    const gbkDecoded = iconv.decode(buffer, 'gbk');
                    if (gbkDecoded.length > 0 && !/[\ufffd]/.test(gbkDecoded)) {
                      result = gbkDecoded;
                    }
                  } catch (e) {
                    // 忽略错误
                  }
                  value = result;
                }
                cleanedItem[key] = value;
              }
            }
            return cleanedItem;
          });
        };
        
        // 合并并清理数据
        const mergedData = {
          income: [...cleanData(existingData.income), ...cleanData(categorizedData.income)],
          expense: [...cleanData(existingData.expense), ...cleanData(categorizedData.expense)],
          neutral: [...cleanData(existingData.neutral), ...cleanData(categorizedData.neutral)],
        };
        
        // 写入合并后的数据
        writeFileSync(billJsonPath, JSON.stringify(mergedData, null, 2), 'utf8');
        console.log('数据已写入bill.json文件');
        
      } else {
        console.error('无法访问分类方法');
      }
      
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
    
    // 验证数据格式
    console.log('\n数据格式验证:');
    if (billData.income.length > 0) {
      console.log('收入数据示例:', JSON.stringify(billData.income[0], null, 2));
    }
    if (billData.expense.length > 0) {
      console.log('支出数据示例:', JSON.stringify(billData.expense[0], null, 2));
    }
    if (billData.neutral.length > 0) {
      console.log('中性数据示例:', JSON.stringify(billData.neutral[0], null, 2));
    }
    
    // 检查是否有乱码
    console.log('\n乱码检查:');
    const hasInvalidChars = (str) => /[\ufffd]/.test(str);
    
    let invalidCharsFound = false;
    
    // 检查收入数据
    for (const item of billData.income) {
      for (const key in item) {
        if (typeof item[key] === 'string' && hasInvalidChars(item[key])) {
          console.error(`收入数据中发现乱码: ${key}: ${item[key]}`);
          invalidCharsFound = true;
        }
      }
    }
    
    // 检查支出数据
    for (const item of billData.expense) {
      for (const key in item) {
        if (typeof item[key] === 'string' && hasInvalidChars(item[key])) {
          console.error(`支出数据中发现乱码: ${key}: ${item[key]}`);
          invalidCharsFound = true;
        }
      }
    }
    
    // 检查中性数据
    for (const item of billData.neutral) {
      for (const key in item) {
        if (typeof item[key] === 'string' && hasInvalidChars(item[key])) {
          console.error(`中性数据中发现乱码: ${key}: ${item[key]}`);
          invalidCharsFound = true;
        }
      }
    }
    
    if (!invalidCharsFound) {
      console.log('未发现乱码，编码处理正确');
    }
    
    // 统计总交易数
    const totalTransactions = billData.income.length + billData.expense.length + billData.neutral.length;
    console.log(`\n总交易数: ${totalTransactions}`);
    
    // 计算总金额
    let totalIncome = 0;
    let totalExpense = 0;
    
    // 计算收入总金额
    for (const item of billData.income) {
      // 尝试从金额字段获取金额
      const amountFields = ['金额', '交易金额', '金额(元)', 'amount', 'AMOUNT', 'F', '_9', 'J'];
      for (const field of amountFields) {
        if (item[field] !== undefined) {
          const value = item[field];
          if (typeof value === 'number') {
            totalIncome += value;
          } else if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
            if (!isNaN(parsed)) {
              totalIncome += parsed;
            }
          }
          break;
        }
      }
    }
    
    // 计算支出总金额
    for (const item of billData.expense) {
      // 尝试从金额字段获取金额
      const amountFields = ['金额', '交易金额', '金额(元)', 'amount', 'AMOUNT', 'F', '_9', 'J'];
      for (const field of amountFields) {
        if (item[field] !== undefined) {
          const value = item[field];
          if (typeof value === 'number') {
            totalExpense += value;
          } else if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
            if (!isNaN(parsed)) {
              totalExpense += parsed;
            }
          }
          break;
        }
      }
    }
    
    console.log(`\n金额统计:`);
    console.log(`- 总收入: ¥${totalIncome.toFixed(2)}`);
    console.log(`- 总支出: ¥${totalExpense.toFixed(2)}`);
    console.log(`- 净收支: ¥${(totalIncome - totalExpense).toFixed(2)}`);
    
    console.log('\nbill.json验证完成!');
    
  } catch (error) {
    console.error(`读取bill.json文件失败: ${error.message}`);
    console.error(error.stack);
  }
}

// 运行测试
testBillJsonGeneration().catch(console.error);
