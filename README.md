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

## 核心数据模型

### 1. 用户模型（User）
- `id`: 唯一标识
- `username`: 用户名（唯一）
- `password`: 密码（哈希存储）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2. 任务模型（Task）
- `id`: 唯一标识
- `user_id`: 用户ID
- `title`: 任务标题
- `description`: 任务描述
- `status`: 任务状态（待办、进行中、已完成）
- `priority`: 优先级（高、中、低）
- `importance`: 重要性（1-4，对应四象限）
- `urgency`: 紧急性（1-4，对应四象限）
- `time_period`: 时间周期（周、月、年）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 3. 记账模型（Transaction）
- `id`: 唯一标识
- `user_id`: 用户ID
- `type`: 类型（收入/支出）
- `amount`: 金额
- `category`: 分类
- `description`: 描述
- `transaction_date`: 交易日期
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 4. 攒钱目标模型（SavingsGoal）
- `id`: 唯一标识
- `user_id`: 用户ID
- `name`: 目标名称
- `target_amount`: 目标金额
- `current_amount`: 当前金额
- `period`: 时间周期（月度、季度、半年、年度）
- `start_date`: 开始日期
- `end_date`: 结束日期
- `status`: 状态（进行中、已完成、已失败）
- `created_at`: 创建时间
- `updated_at`: 更新时间

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
| 方法     | 路径                         | 描述              |
| ------ | -------------------------- | --------------- |
| POST   | /api/tasks                 | 创建任务            |
| GET    | /api/tasks                 | 获取任务列表（支持筛选和分页） |
| GET    | /api/tasks/:id             | 获取任务详情          |
| PUT    | /api/tasks/:id             | 更新任务            |
| DELETE | /api/tasks/:id             | 删除任务            |
| PUT    | /api/tasks/:id/status      | 更新任务状态          |
| GET    | /api/tasks/by-time/:period | 按时间周期获取任务       |
| GET    | /api/tasks/by-quadrant     | 按四象限获取任务        |

### 4. 记账功能接口
| 方法     | 路径                           | 描述                |
| ------ | ---------------------------- | ----------------- |
| POST   | /api/transactions            | 创建交易记录            |
| GET    | /api/transactions            | 获取交易记录列表（支持筛选和分页） |
| GET    | /api/transactions/:id        | 获取交易记录详情          |
| PUT    | /api/transactions/:id        | 更新交易记录            |
| DELETE | /api/transactions/:id        | 删除交易记录            |
| GET    | /api/transactions/statistics | 获取收支统计            |

### 5. 攒钱目标接口
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
├── middleware/
│   └── logger.middleware.ts     # API请求日志中间件
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
└── utils/
    └── logger.ts                # 日志配置
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