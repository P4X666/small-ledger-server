# 数据库设置指南

本文档提供了在不同操作系统上设置small-ledger数据库的详细步骤。

## 前提条件

1. 已安装MySQL数据库服务器
2. 已安装MySQL客户端工具
3. 已创建具有创建数据库权限的MySQL用户

## 配置文件

### 环境变量配置

在项目根目录下，根据环境创建相应的配置文件：

- **开发环境**：`.env.development`
- **生产环境**：`.env.production`

配置文件内容示例：

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

## 设置脚本

项目根目录下提供了两个设置脚本，分别适用于不同操作系统：

### Bash脚本

**文件**：`setup_database.sh`

**使用方法**：

```bash
# 1. 赋予脚本执行权限
chmod +x setup_database.sh

# 2. 执行脚本
./setup_database.sh
```

## 手动设置步骤

如果不想使用脚本，也可以手动执行以下步骤：

### 1. 创建数据库

```sql
CREATE DATABASE small_ledger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 导入表结构

```bash
# Linux/macOS
mysql -u admin -p123456 small_ledger < create_tables.sql

# Windows PowerShell
mysql -u admin -p123456 small_ledger -e "$(Get-Content -Encoding UTF8 create_tables.sql)"
```

### 3. 验证创建结果

```sql
USE small_ledger;
SHOW TABLES;
```

## 注意事项

1. **字符集设置**：确保数据库、表和列都使用`utf8mb4`字符集
2. **编码一致性**：确保SQL文件使用UTF-8编码
3. **密码安全**：不要在生产环境中使用简单密码
4. **权限控制**：为应用程序创建专用数据库用户，仅授予必要权限
5. **备份数据**：定期备份数据库，特别是在执行重大操作前
6. **版本控制**：将数据库脚本纳入版本控制

## 常见问题

### 1. MySQL客户端未找到

**错误信息**：
```
mysql: command not found
```

**解决方案**：
- 安装MySQL客户端：
  - Linux：`sudo apt-get install mysql-client` (Ubuntu) 或 `sudo yum install mysql` (CentOS)
  - macOS：`brew install mysql-client`
  - Windows：从MySQL官网下载并安装MySQL Installer

### 2. 密码认证失败

**错误信息**：
```
ERROR 1045 (28000): Access denied for user 'admin'@'localhost' (using password: YES)
```

**解决方案**：
- 检查用户名和密码是否正确
- 确保用户具有创建数据库的权限
- 检查用户的主机权限（是否允许从localhost访问）

### 3. 表创建失败（字符集错误）

**错误信息**：
```
ERROR 1067 (42000): Invalid default value for 'status'
ERROR 1291 (HY000): Column 'status' has duplicated value '???'
```

**解决方案**：
- 确保SQL文件使用UTF-8编码
- 确保数据库和表使用正确的字符集
- 使用修复后的`create_tables.sql`文件

## 后续操作

1. 启动应用程序：
   ```bash
   # 开发环境
   npm run start:dev
   
   # 生产环境
   npm run start:prod
   ```

2. 访问Swagger文档：
   ```
   http://localhost:3000/api-docs
   ```

3. 测试API接口：
   ```bash
   curl http://localhost:3000/health
   ```

## 维护建议

1. **定期备份**：设置定期备份策略，确保数据安全
2. **监控性能**：定期检查数据库性能，优化查询
3. **更新统计信息**：定期运行`ANALYZE TABLE`更新表统计信息
4. **优化索引**：根据查询情况优化索引
5. **清理数据**：定期清理过期数据

通过以上步骤，您可以在不同电脑上成功设置small-ledger数据库，确保应用程序能够正常运行。