import * as fs from 'fs';
import * as path from 'path';

function validateSwagger() {
  console.log('开始验证Swagger文档...');

  const swaggerPath = path.join(process.cwd(), 'swagger-spec.json');

  if (!fs.existsSync(swaggerPath)) {
    console.error('Swagger文档不存在！');
    process.exit(1);
  }

  try {
    const swaggerDoc = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

    // 验证文档结构
    if (!swaggerDoc.openapi) {
      console.error('Swagger文档缺少openapi字段！');
      process.exit(1);
    }

    if (!swaggerDoc.paths) {
      console.error('Swagger文档缺少paths字段！');
      process.exit(1);
    }

    if (!swaggerDoc.components?.schemas) {
      console.error('Swagger文档缺少components.schemas字段！');
      process.exit(1);
    }

    // 验证SavingsGoals相关文档
    const savingsGoalsPaths = Object.keys(swaggerDoc.paths).filter((path) =>
      path.includes('/savings-goals'),
    );
    if (savingsGoalsPaths.length === 0) {
      console.error('Swagger文档缺少SavingsGoals相关路径！');
      process.exit(1);
    }

    // 验证DTO和实体定义
    const requiredSchemas = [
      'CreateSavingsGoalDto',
      'UpdateSavingsGoalDto',
      'UpdateSavingsGoalAmountDto',
      'SavingsGoalProgressDto',
      'SavingsGoal',
    ];

    for (const schema of requiredSchemas) {
      if (!swaggerDoc.components.schemas[schema]) {
        console.error(`Swagger文档缺少${schema}定义！`);
        process.exit(1);
      }
    }

    console.log('Swagger文档验证成功！');
  } catch (error) {
    console.error('Swagger文档验证失败:', error);
    process.exit(1);
  }
}

validateSwagger();
