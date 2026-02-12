#!/bin/bash

# 数据库连接参数
DB_USER="admin"
DB_PASSWORD="123456"
DB_NAME="small_ledger"

# 生成时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 备份文件名
BACKUP_FILE="small_ledger_${TIMESTAMP}.sql"

# 执行备份
echo "开始创建时间戳备份..."
mysqldump -u "$DB_USER" -p"$DB_PASSWORD" --single-transaction --quick --hex-blob --routines --events "$DB_NAME" > "$BACKUP_FILE"

# 检查备份是否成功
if [ $? -eq 0 ]; then
    echo "备份成功！备份文件：$BACKUP_FILE"
    echo "文件大小：$(ls -lh "$BACKUP_FILE" | awk '{print $5}')"
else
    echo "备份失败！"
    exit 1
fi
