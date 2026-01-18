const { ExcelController } = require('../../dist/excel/excel.controller');
const { ExcelService } = require('../../dist/excel/excel.service');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

async function testCategorizeLogic() {
  console.log('开始测试分类逻辑...');
  
  // 初始化服务
  const excelService = new ExcelService();
  const excelController = new ExcelController(excelService);
  
  // 测试文件路径
  const sourceDir = join(__dirname, '../../source');
  const testFiles = [
    join(sourceDir, 'alipay_record_20260116_2102.zip'),
    join(sourceDir, '微信支付账单流水文件(20260112-20260116)_20260116210056.xlsx')
  ];
  
  // 解析每个测试文件并测试分类逻辑
  for (const filePath of testFiles) {
    console.log(`\n解析文件: ${filePath}`);
    try {
      // 根据文件类型设置跳过行数
      const ext = filePath.substring(filePath.lastIndexOf('.'));
      let skipRows = 0;
      if (ext === '.xlsx' || ext === '.xls') {
        skipRows = 15; // Excel格式跳过15行
      } else if (ext === '.csv' || ext === '.zip') {
        skipRows = 4; // CSV和ZIP格式跳过4行
      }
      
      // 解析文件
      const result = await excelService.parse(filePath, { skipRows });
      console.log(`解析成功: ${result.totalRows}行数据, 耗时${result.parseTime}ms`);
      console.log(`数据行数: ${result.data.length}`);
      
      // 测试分类逻辑
      console.log('测试分类逻辑...');
      
      // 直接测试分类函数
      // 注意：这里需要访问私有方法，实际项目中应该通过公共方法测试
      const categorizeMethod = excelController['categorizeTransactions'];
      if (typeof categorizeMethod === 'function') {
        const categorized = categorizeMethod.call(excelController, result.data);
        console.log('分类结果:');
        console.log(`- 收入: ${categorized.income.length}`);
        console.log(`- 支出: ${categorized.expense.length}`);
        console.log(`- 中性: ${categorized.neutral.length}`);
        
        // 打印部分数据示例
        if (categorized.expense.length > 0) {
          console.log('支出数据示例:', JSON.stringify(categorized.expense[0], null, 2));
        }
        if (categorized.income.length > 0) {
          console.log('收入数据示例:', JSON.stringify(categorized.income[0], null, 2));
        }
      } else {
        console.log('无法访问分类方法');
      }
      
      // 手动测试分类逻辑
      console.log('\n手动测试分类逻辑:');
      result.data.forEach((transaction, index) => {
        console.log(`\n交易 ${index + 1}:`);
        console.log('字段:', Object.keys(transaction));
        
        // 测试支付宝判断
        const isAlipayPayment = transaction['_10'] !== undefined && transaction['_15'] !== undefined;
        console.log('是否支付宝交易:', isAlipayPayment);
        if (isAlipayPayment) {
          console.log('_10值:', transaction['_10']);
          console.log('_15值:', transaction['_15']);
        }
        
        // 测试微信支付判断
        const isWechatPayment = transaction['交易类型'] !== undefined && transaction['收/支'] !== undefined;
        console.log('是否微信支付交易:', isWechatPayment);
        
        // 测试通用方向字段
        const directionFields = ['收/支', '收支', 'direction', 'E', 'K'];
        let directionType = '';
        for (const field of directionFields) {
          if (transaction[field] !== undefined) {
            directionType = String(transaction[field]);
            console.log('找到方向字段:', field, '=', directionType);
            break;
          }
        }
        
        // 测试金额字段
        const amountFields = ['金额', '交易金额', '金额(元)', 'amount', 'AMOUNT', 'F', '_9', 'J'];
        let amount = 0;
        for (const field of amountFields) {
          if (transaction[field] !== undefined) {
            const value = transaction[field];
            console.log('找到金额字段:', field, '=', value);
            if (typeof value === 'number') {
              amount = value;
            } else if (typeof value === 'string') {
              const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
              if (!isNaN(parsed)) {
                amount = parsed;
                console.log('解析金额:', parsed);
              }
            }
            break;
          }
        }
        
        console.log('最终金额:', amount);
      });
      
    } catch (error) {
      console.error(`解析失败: ${error.message}`);
      console.error(error.stack);
    }
  }
}

// 运行测试
testCategorizeLogic().catch(console.error);
