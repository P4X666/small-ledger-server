#!/bin/bash

# 数据库设置脚本
# 用于创建和配置small-ledger数据库

# 配置参数
DB_USER="admin"
DB_PASSWORD="123456"
DB_NAME="small_ledger"
DB_CHARSET="utf8mb4"
DB_COLLATION="utf8mb4_unicode_ci"

# 检查MySQL是否可用
if ! command -v mysql &> /dev/null; then
    echo "MySQL客户端未安装，请先安装MySQL客户端"
    exit 1
fi

# 1. 创建数据库
echo "创建数据库 $DB_NAME..."
mysql -u $DB_USER -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET $DB_CHARSET COLLATE $DB_COLLATION;"

# 2. 导入表结构
echo "导入表结构..."
mysql -u $DB_USER -p$DB_PASSWORD --default-character-set=$DB_CHARSET $DB_NAME < create_tables.sql

# 3. 验证创建结果
echo "验证表创建结果..."
mysql -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES;"

echo "数据库设置完成！"
