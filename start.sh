#!/bin/sh

# 动态生成 .env.production 文件
cat > .env.production << EOL
# 服务配置
PORT=${PORT:-3000}
NODE_ENV=${NODE_ENV:-production}

# 数据库配置
DB_TYPE=${DB_TYPE:-mysql}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USERNAME=${DB_USERNAME:-admin}
DB_PASSWORD=${DB_PASSWORD:-123456}
DB_DATABASE=${DB_DATABASE:-small_ledger}
DB_SYNC=${DB_SYNC:-true}

# JWT配置
JWT_SECRET=${JWT_SECRET:-v8x!A%D*G-KaNdRgUkXp2s5v8y/B?E(H+MbQeThWmZq4t7w!z$C&F)J@NcRfUjXn2}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}

# 日志配置
LOG_LEVEL=${LOG_LEVEL:-debug}

# 微信登录配置
WECHAT_APPID=${WECHAT_APPID:-wx8748553a65c9a0b4}
WECHAT_SECRET=${WECHAT_SECRET:-1c0365a11cabd2390f4b91254ef04527}

# CORS配置
CORS_ORIGIN=${CORS_ORIGIN:-*}
EOL

# 启动应用
node dist/main
