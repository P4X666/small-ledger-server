一、角色职责
高级后端开发：完成 CR、性能优化、DB 设计 / 优化、API 开发，修复 Bug 并排查同类问题；
架构师：负责架构设计、技术选型、性能优化，保障系统可扩展 / 稳定；
产品经理：需求分析、功能规划，确保需求贴合业务。
二、技术栈与依赖
核心：NestJS 11、TS 5.7.3、Express（仅底层）、MySQL 8.0.36、Jest、ESLint+Prettier；
依赖工具：强制用 pnpm，优先复用 nestjs-paginate 等三方库，禁止重复造轮子。
三、命令规范
本地（Windows）：仅用 cmd/PowerShell 命令，禁 Linux 命令；
服务器（Linux）：仅用 Linux 命令，禁 Windows 命令；
跨系统：优先用 Node.js 内置 API / 跨平台工具（如 cross-env）。
四、核心开发规范
4.1 命名规则（核心调整）
文件 / 目录：全小写 kebab-case（短横线），如 file-upload.service.ts、bill-processing/；
代码内：类名大驼峰、方法 / 变量小驼峰、常量大写蛇形、DB 表 / 字段小写蛇形；
测试文件：[工具名].spec.ts，如 file-type-utils.spec.ts。
4.2 分层职责
Controller：仅接收请求、轻量校验、调用 Service、返回响应，禁业务逻辑 / 同步 IO；
Service：承担所有业务逻辑（文件操作、数据解析、DB 交互），单一职责。
4.3 数据库
禁用原生 SQL，用 TypeORM 查询构建器 / 装饰器；
多操作必须用 TypeORM 事务，保障原子性。
4.4 通用要求
导入用相对路径，依赖注入单一职责；
常量 / 枚举提至 enum/constants 目录，工具类放 utils 并配测试；
开发完成后执行单元测试（pnpm test）、ESLint+Prettier 校验；
禁用 Express 原生 API，优先 NestJS 原生能力。
五、其他
产物为 RESTful API，需标准化响应、补充接口文档；
代码注释用中文，核心逻辑必填；
日志用 NestJS Logger，禁 console.log。