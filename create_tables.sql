-- 创建用户表
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '唯一标识',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（哈希存储）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 创建任务表
CREATE TABLE `tasks` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '唯一标识',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `title` VARCHAR(100) NOT NULL COMMENT '任务标题',
  `description` TEXT COMMENT '任务描述',
  `status` ENUM('todo', 'in_progress', 'completed') DEFAULT 'todo' COMMENT '任务状态',
  `priority` ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '优先级',
  `importance` TINYINT CHECK (importance BETWEEN 1 AND 4) DEFAULT 2 COMMENT '重要性（1-4，对应四象限）',
  `urgency` TINYINT CHECK (urgency BETWEEN 1 AND 4) DEFAULT 2 COMMENT '紧急性（1-4，对应四象限）',
  `time_period` ENUM('week', 'month', 'year') DEFAULT 'week' COMMENT '时间周期',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_time_period` (`time_period`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务表';

-- 创建交易记录表
CREATE TABLE `transactions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '唯一标识',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `type` ENUM('income', 'expense') NOT NULL COMMENT '类型（收入/支出）',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
  `category` VARCHAR(50) NOT NULL COMMENT '分类',
  `description` VARCHAR(255) COMMENT '描述',
  `transaction_date` DATE NOT NULL COMMENT '交易日期',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_category` (`category`),
  INDEX `idx_transaction_date` (`transaction_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易记录表';

-- 创建攒钱目标表
CREATE TABLE `savings_goals` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '唯一标识',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '目标名称',
  `target_amount` DECIMAL(10,2) NOT NULL COMMENT '目标金额',
  `current_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '当前金额',
  `period` ENUM('month', 'quarter', 'half_year', 'year') NOT NULL COMMENT '时间周期',
  `start_date` DATE NOT NULL COMMENT '开始日期',
  `end_date` DATE NOT NULL COMMENT '结束日期',
  `status` ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress' COMMENT '状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_period` (`period`),
  INDEX `idx_start_end_date` (`start_date`, `end_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='攒钱目标表';