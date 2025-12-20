# 使用官方 Node.js 20 镜像作为构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 清理不必要的依赖
RUN pnpm prune --prod

# 使用更小的镜像作为运行阶段
FROM node:20-alpine

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 从构建阶段复制必要的文件
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# 复制环境变量示例文件
COPY --from=builder /app/.env.production ./

# 更改文件所有者为非 root 用户
RUN chown -R nestjs:nodejs /app

# 切换到非 root 用户
USER nestjs

# 暴露应用端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "dist/main"]
