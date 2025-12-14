# 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 生产阶段
FROM node:20-alpine AS runner

# 设置工作目录
WORKDIR /app

# 安装 pnpm 和 curl（用于健康检查）
RUN npm install -g pnpm && apk add --no-cache curl

# 从构建阶段复制依赖和构建产物
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.production ./

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 添加健康检查
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#   CMD curl -f http://0.0.0.0:3000/health || exit 1

# 启动命令
CMD ["pnpm", "run", "start:prod"]