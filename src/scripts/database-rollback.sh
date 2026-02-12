#!/bin/bash

# 数据库连接参数
DB_USER="admin"
DB_PASSWORD="123456"
DB_NAME="small_ledger"

# 查找最近的备份文件
echo "查找最近的时间戳备份文件..."
LATEST_BACKUP=$(ls -t small_ledger_*.sql 2>/dev/null | grep -v complete | head -n 1)

# 检查是否找到备份文件
if [ -z "$LATEST_BACKUP" ]; then
    echo "错误：未找到时间戳备份文件！"
    echo "请先执行 'pnpm backup:timestamp' 创建备份。"
    exit 1
fi

# 显示找到的备份文件
echo "找到最近的备份文件：$LATEST_BACKUP"
echo "文件大小：$(ls -lh "$LATEST_BACKUP" | awk '{print $5}')"
echo "文件创建时间：$(stat -c %y "$LATEST_BACKUP" 2>/dev/null || stat -f %Sm "$LATEST_BACKUP" 2>/dev/null || echo "未知")"

# 确认是否执行回滚
echo -n "是否执行回滚操作？(y/n): "
read CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "取消回滚操作。"
    exit 0
fi

# 执行回滚
echo "开始执行回滚操作..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$LATEST_BACKUP"

# 检查回滚是否成功
if [ $? -eq 0 ]; then
    echo "回滚成功！数据库已恢复到备份时的状态。"
else
    echo "回滚失败！"
    exit 1
fi
