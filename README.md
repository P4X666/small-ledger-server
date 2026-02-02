# small-ledger-server
家有小账本 - 服务端API

## 项目概述
为家有小账本微信小程序提供后端API支持，实现任务管理、记账功能和攒钱目标等核心业务逻辑。

## 技术栈
- **后端框架**：NestJS + TypeScript
- **数据库**：MySQL
- **认证机制**：JWT (JSON Web Token) + 用户名密码认证
- **API设计**：RESTful API
- **日志管理**：Winston（控制台输出 + 文件存储）
- **测试框架**：Jest
- **文档工具**：Swagger
- **文件上传**：Multer
- **Excel处理**：xlsx (Excel解析)、csv-parser (CSV解析)、adm-zip (ZIP处理)
- **日期处理**：dayjs
- **字符编码**：iconv-lite
- **文件系统**：fs-extra
- **货币计算**：currency.js

## 核心数据模型

### 1. 用户模型（User）
- `id`: 唯一标识
- `username`: 用户名（唯一）
- `password`: 密码（哈希存储）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2. 任务模型（Task）

#### 核心目标
任务模型旨在帮助用户有效地管理个人任务，通过四象限法则和时间周期管理，提高任务执行效率和时间管理能力。

#### 数据结构
- `id`: 唯一标识
- `user_id`: 用户ID
- `title`: 任务标题
- `description`: 任务描述
- `status`: 任务状态（待办、进行中、已完成）
- `priority`: 优先级（高、中、低）
- `importance`: 重要性（1-4，对应四象限）
- `urgency`: 紧急性（1-4，对应四象限）
- `time_period`: 时间周期（周、月、年）
- `isDeleted`: 删除状态（false: 未删除, true: 已删除）
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### 关键功能模块
1. **任务创建与管理**：支持创建、更新、删除（标记删除状态）任务
2. **任务状态管理**：支持更新任务状态
3. **任务分类与筛选**：
   - 按时间周期筛选（周、月、年）
   - 按四象限筛选（基于重要性和紧急性）
   - 支持分页、排序和搜索
4. **任务统计**：提供任务总数、进行中任务数、高优先级任务数等统计数据
5. **软删除机制**：删除操作仅标记删除状态，不实际删除数据
6. **已删除任务管理**：支持查询已删除任务列表

#### 主要工作流程
1. **任务创建**：用户创建任务，系统自动计算优先级并设置初始状态
2. **任务查询**：用户可通过多种方式查询任务（默认过滤已删除任务）
3. **任务更新**：用户可更新任务详情或状态
4. **任务删除**：用户删除任务时，系统标记任务为已删除状态
5. **已删除任务查询**：用户可查询已删除任务列表

#### 输入输出参数说明

##### 创建任务
- **输入参数**：
  - `title`: 任务标题（必填）
  - `description`: 任务描述（可选）
  - `timePeriod`: 时间周期（周、月、年）
  - `importance`: 重要性（1-4）
  - `urgency`: 紧急性（1-4）
- **输出参数**：创建的任务对象

##### 更新任务
- **输入参数**：
  - `title`: 任务标题（可选）
  - `description`: 任务描述（可选）
  - `timePeriod`: 时间周期（可选）
  - `status`: 任务状态（可选）
  - `priority`: 优先级（可选）
  - `importance`: 重要性（可选）
  - `urgency`: 紧急性（可选）
- **输出参数**：更新后的任务对象

##### 查询任务列表
- **输入参数**：
  - `timePeriod`: 时间周期（可选）
  - `page`: 页码（默认1）
  - `limit`: 每页条数（默认10）
  - `sortBy`: 排序字段（默认id）
  - `sortOrder`: 排序方向（ASC/DESC，默认ASC）
  - `search`: 搜索关键词（可选）
- **输出参数**：任务列表、总数、页码、每页条数

##### 查询已删除任务
- **输入参数**：
  - `page`: 页码（默认1）
  - `limit`: 每页条数（默认10）
  - `sortBy`: 排序字段（默认updated_at）
  - `sortOrder`: 排序方向（ASC/DESC，默认DESC）
  - `status`: 状态筛选（可选）
  - `timePeriod`: 时间周期筛选（可选）
- **输出参数**：已删除任务列表、总数、页码、每页条数

#### 使用场景
1. **日常任务管理**：用户创建和管理日常工作、生活任务
2. **时间规划**：通过时间周期管理，合理规划不同时间跨度的任务
3. **优先级排序**：基于四象限法则，优先处理重要且紧急的任务
4. **任务分析**：通过统计数据，分析任务完成情况和时间分配
5. **任务归档**：已删除任务可查询，便于回顾和分析

#### 限制条件
1. **权限限制**：用户只能访问和管理自己的任务
2. **数据安全**：敏感操作需要JWT认证
3. **性能优化**：查询操作在数据库层面实现过滤，确保性能
4. **数据一致性**：删除操作采用软删除机制，确保数据完整性
5. **分页限制**：默认分页大小为10，可根据实际需求调整

### 3. 记账模型（Transaction）
- `id`: 唯一标识
- `user_id`: 用户ID
- `bill_id`: 账单ID（用于账单导入）
- `type`: 类型（收入/支出/中性）
- `amount`: 金额
- `category`: 分类
- `description`: 描述
- `shop`: 商家名称
- `product`: 商品名称
- `platform`: 支付平台（支付宝/微信支付）
- `transaction_date`: 交易日期
- `transaction_start_date`: 交易开始日期
- `transaction_end_date`: 交易结束日期
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 4. 攒钱目标模型（SavingsGoal）
- `id`: 唯一标识
- `user_id`: 用户ID
- `name`: 目标名称
- `target_amount`: 目标金额
- `current_amount`: 当前金额
- `start_date`: 开始日期
- `end_date`: 结束日期
- `status`: 状态（进行中、已完成、已失败）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 5. Excel账单导入模型

#### 核心目标
Excel账单导入模型旨在帮助用户快速导入和管理支付宝、微信支付等平台的账单数据，实现自动分类、转换和存储，提高记账效率。

#### 支持格式
- Excel文件：`.xlsx`、`.xls`（微信支付账单）
- CSV文件：`.csv`（支付宝账单）
- 压缩文件：`.zip`（支付宝账单压缩包）

#### 数据处理流程
1. **文件上传**：用户上传账单文件
2. **格式验证**：验证文件格式和完整性
3. **数据解析**：根据文件类型选择合适的解析器
4. **数据清洗**：过滤无效数据，统一格式
5. **自动分类**：根据交易类型自动分类为收入/支出/中性
6. **重复检查**：根据账单ID检查重复记录
7. **数据导入**：导入到交易表，支持新增和更新

#### 关键功能模块
1. **多格式支持**：支持多种账单格式和支付平台
2. **智能解析**：自动识别文件格式和支付平台
3. **数据去重**：避免重复导入相同交易记录
4. **自动分类**：根据交易类型智能分类
5. **批量处理**：支持批量导入多个文件
6. **交易统计**：实时统计导入结果

#### 事件驱动架构
Excel账单导入模块采用事件驱动架构实现控制器与服务层的解耦，主要包含以下事件类型：

##### 事件类型定义
```typescript
export enum ExcelEventTypes {
  /** 文件上传事件 */
  FILE_UPLOADED = 'excel.file.uploaded',
  /** 账单处理完成事件 */
  BILL_PROCESSED = 'excel.bill.processed',
}
```

##### 事件发布与处理流程
1. **ExcelController** 接收文件上传请求，验证文件后发布 `FILE_UPLOADED` 事件
2. **BillService** 监听 `FILE_UPLOADED` 事件，异步处理账单文件
3. 处理完成后发布 `BILL_PROCESSED` 事件，供后续扩展（如推送通知、任务状态查询）

##### 架构优势
- **解耦性**：控制器专注于请求接收和响应，服务层专注于业务逻辑
- **可扩展性**：易于添加新的事件监听器处理不同场景（如日志记录、通知推送）
- **异步处理**：文件处理不阻塞主请求线程，提升用户体验
- **单一职责**：各模块职责清晰，便于测试和维护

##### 使用场景
1. **账单批量导入**：快速导入历史账单数据
2. **多平台账单管理**：统一管理不同支付平台的账单
3. **自动记账**：减少手动记账的工作量
4. **数据备份**：定期导入账单作为数据备份

#### 限制条件
1. **文件大小**：受服务器配置限制
2. **格式要求**：必须使用各支付平台的标准账单格式
3. **权限限制**：用户只能导入自己的账单数据
4. **数据安全**：敏感操作需要JWT认证

## API接口设计

### 1. 认证相关接口
| 方法   | 路径                 | 描述     |
| ---- | ------------------ | ------ |
| POST | /api/auth/register | 用户注册   |
| POST | /api/auth/login    | 用户登录   |

### 2. 用户相关接口
| 方法   | 路径             | 描述     |
| ---- | -------------- | ------ |
| GET  | /api/users/:id | 获取用户信息 |
| PUT  | /api/users/:id | 更新用户信息 |

### 3. 任务管理接口
| 方法     | 路径                             | 描述              |
| ------ | --------------------------------  | --------------- |
| POST   | /api/tasks                        | 创建任务            |
| GET    | /api/tasks                        | 获取任务列表（支持筛选和分页） |
| GET    | /api/tasks/:id                    | 获取任务详情          |
| PUT    | /api/tasks/:id                    | 更新任务            |
| DELETE | /api/tasks/:id                    | 删除任务（标记删除状态）    |
| PUT    | /api/tasks/:id/status             | 更新任务状态          |
| GET    | /api/tasks/by-time/:period        | 按时间周期获取任务       |
| GET    | /api/tasks/by-quadrant            | 按四象限获取任务        |
| GET    | /api/tasks/getTasksNum     | 获取任务统计数据        |
| GET    | /api/tasks/deleted                | 获取已删除任务列表（支持筛选和分页） |

### 4. 记账功能接口
| 方法     | 路径                           | 描述                |
| ------ | ---------------------------- | ----------------- |
| POST   | /api/transactions            | 创建交易记录            |
| GET    | /api/transactions            | 获取交易记录列表（支持筛选和分页） |
| GET    | /api/transactions/:id        | 获取交易记录详情          |
| PUT    | /api/transactions/:id        | 更新交易记录            |
| DELETE | /api/transactions/:id        | 删除交易记录            |
| GET    | /api/transactions/statistics | 获取收支统计            |

### 5. Excel账单导入接口
| 方法     | 路径                   | 描述                |
| ------ | -------------------- | ----------------- |
| POST   | /api/excel/upload    | 上传并处理账单文件        |

### 6. 攒钱目标接口
| 方法     | 路径                              | 描述       |
| ------ | ------------------------------- | -------- |
| POST   | /api/savings-goals              | 创建攒钱目标   |
| GET    | /api/savings-goals              | 获取攒钱目标列表 |
| GET    | /api/savings-goals/:id          | 获取攒钱目标详情 |
| PUT    | /api/savings-goals/:id          | 更新攒钱目标   |
| DELETE | /api/savings-goals/:id          | 删除攒钱目标   |
| PUT    | /api/savings-goals/:id/amount   | 更新当前金额   |
| GET    | /api/savings-goals/:id/progress | 获取目标进度   |

## 项目结构
```
src/
├── app.module.ts                 # 应用根模块
├── main.ts                      # 应用入口文件
├── config/                      # 配置模块
│   └── jwt.config.ts            # JWT配置
├── enum/                        # 枚举定义
│   └── index.ts                 # 枚举类型定义
├── middleware/
│   └── logger.middleware.ts     # API请求日志中间件
├── interceptors/
│   └── response.interceptor.ts  # 响应拦截器
├── auth/                        # 认证模块
│   ├── auth.module.ts           # 认证模块配置
│   ├── auth.service.ts          # 认证服务
│   ├── auth.controller.ts       # 认证控制器
│   ├── jwt.strategy.ts          # JWT认证策略
│   ├── jwt-auth.guard.ts        # JWT认证守卫
│   └── get-current-user.decorator.ts  # 获取当前用户装饰器
├── users/                       # 用户模块
│   ├── users.module.ts          # 用户模块配置
│   ├── users.controller.ts      # 用户控制器
│   ├── users.service.ts         # 用户服务
│   ├── users.entity.ts          # 用户实体
│   └── users.dto.ts             # 用户数据传输对象
├── tasks/                       # 任务模块
│   ├── tasks.module.ts          # 任务模块配置
│   ├── tasks.controller.ts      # 任务控制器
│   ├── tasks.service.ts         # 任务服务
│   ├── tasks.entity.ts          # 任务实体
│   └── tasks.dto.ts             # 任务数据传输对象
├── transactions/                # 交易模块
│   ├── transactions.module.ts   # 交易模块配置
│   ├── transactions.controller.ts # 交易控制器
│   ├── transactions.service.ts  # 交易服务
│   ├── transactions.entity.ts   # 交易实体
│   └── transactions.dto.ts      # 交易数据传输对象
├── savings-goals/               # 攒钱目标模块
│   ├── savings-goals.module.ts  # 攒钱目标模块配置
│   ├── savings-goals.controller.ts # 攒钱目标控制器
│   ├── savings-goals.service.ts # 攒钱目标服务
│   ├── savings-goals.entity.ts  # 攒钱目标实体
│   └── savings-goals.dto.ts     # 攒钱目标数据传输对象
├── excel/                       # Excel账单导入模块
│   ├── excel.module.ts          # Excel模块配置
│   ├── excel.controller.ts      # Excel控制器
│   ├── excel.service.ts         # Excel服务
│   ├── bill.service.ts          # 账单处理服务
│   ├── upload-file.service.ts   # 文件上传服务
│   ├── excel.parser.factory.ts  # 解析器工厂
│   ├── excel.interface.ts       # 接口定义
│   └── index.ts                 # 模块导出
└── utils/
    ├── logger.ts                # 日志配置
    ├── common.ts                # 通用工具
    ├── http-exception.filter.ts # HTTP异常过滤器
    └── excel/                   # Excel工具
        ├── csv.parser.ts        # CSV解析器
        ├── xlsx.parser.ts       # Excel解析器
        ├── zip.parser.ts        # ZIP解析器
        ├── data-cleaner.ts      # 数据清洗工具
        └── file-type-utils.ts   # 文件类型工具
test/
├── 测试
```

## 安装和运行

### 安装依赖
```bash
pnpm install
```

### 开发模式运行
```bash
pnpm run start:dev
```

### 构建生产版本
```bash
pnpm run build
```

### 生产模式运行
```bash
pnpm run start:prod
```

## 配置说明

### 环境变量配置
创建 `.env.development` 文件（开发环境）和 `.env.production` 文件（生产环境），包含以下配置项：

```env
# 服务配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=123456
DB_DATABASE=small_ledger
DB_SYNC=true

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=debug
```
注意数据库的字符集和排序规则设置为utf8mb4_unicode_ci，以支持emoji等特殊字符。
```sql
CREATE DATABASE small_ledger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 日志管理

### 日志配置
- **日志级别**：debug（控制台）和info（文件）
- **控制台输出**：使用简单格式，便于开发调试
- **文件输出**：
  - 日志目录：`./log2`
  - 文件名格式：`${process.env.NODE_ENV}-YYYY-MM-DD-HH-mm.log`
  - 每日定时轮换，每分钟生成一个新日志文件
  - 日志文件大小限制：1KB

### 日志内容
- **请求日志**：记录请求时间、请求方法、请求URL、请求头、请求体、查询参数、路径参数和客户端IP
- **响应日志**：记录响应时间、响应状态码、响应状态信息和响应耗时
- 日志格式包含时间戳、日志级别和具体内容
- 敏感信息（如Authorization头）被自动脱敏处理

## 认证机制

### JWT认证流程
1. 用户注册：`POST /api/auth/register`
2. 用户登录：`POST /api/auth/login`，获取JWT令牌
3. 访问受保护API：在请求头中添加 `Authorization: Bearer <token>`
4. 服务器验证令牌，允许或拒绝访问

### 认证保护
- 使用 `JwtAuthGuard` 保护需要认证的路由
- 使用 `GetCurrentUser` 装饰器获取当前用户信息
- 受保护的API包括：任务管理、交易管理、攒钱目标管理等

## 测试

### 运行单元测试
```bash
pnpm run test
```

### 运行端到端测试
```bash
pnpm run test:e2e
```

## API返回格式规范

### 统一返回格式
为确保前后端数据交互的一致性和前端处理的便捷性，所有接口均遵循以下统一返回格式：

```json
{
  "code": 200,
  "message": null,
  "data": { /* 业务数据 */ },
  "timestamp": 1766046555453
}
```

### 字段说明
- **`code`**：数值类型，接口请求的状态码
  - 200：请求成功
  - 400：参数错误
  - 401：未授权（需要登录）
  - 403：权限不足
  - 404：资源不存在
  - 500：服务器内部错误

- **`message`**：字符串类型，错误信息
  - 成功时：显式设置为`null`
  - 失败时：返回具体错误描述

- **`data`**：任意类型，业务数据
  - 成功时：返回具体业务数据
  - 失败时：返回`null`

- **`timestamp`**：数值类型，接口响应的时间戳（精确到毫秒）

### 状态码说明

| 状态码 | 含义       | 场景示例                          |
| ------ | ---------- | --------------------------------- |
| 200    | 请求成功   | 正常获取数据、操作成功            |
| 400    | 参数错误   | 缺少必填字段、参数格式不正确      |
| 401    | 未授权     | 未提供令牌、令牌失效、令牌过期    |
| 403    | 权限不足   | 无操作权限、越权访问              |
| 404    | 资源不存在 | 请求的资源（如用户、任务）不存在  |
| 500    | 服务器错误 | 数据库异常、代码逻辑错误、外部服务异常 |

## API文档
项目提供Swagger API文档，访问地址：http://localhost:3000/api-docs

### 生成API规范文件
项目启动时会自动生成Swagger API规范文件：
- JSON格式：`./swagger-spec.json`

## 注意事项
- 确保生产环境的环境变量配置正确
- 配置适当的安全措施，如 HTTPS、请求频率限制等
- 定期备份数据库
- 生产环境中设置 `DB_SYNC=false`，避免自动同步数据库结构

### 测试环境数据库配置
- 数据库类型：MySQL
- 数据库名称：small_ledger
- 数据库用户名：admin
- 数据库密码：123456
- 数据库主机：localhost
- 数据库端口：3306

## 开发说明

### 代码规范
- 使用TypeScript编写代码
- 遵循NestJS最佳实践
- 使用ESLint和Prettier进行代码检查和格式化

### 错误处理
- 统一的错误响应格式
- 认证失败返回401状态码
- 资源不存在返回404状态码
- 其他错误返回500状态码

### 安全措施
- 密码使用bcrypt加密存储
- JWT令牌用于身份验证
- 使用HTTPS（生产环境）
- 请求频率限制（建议生产环境配置）