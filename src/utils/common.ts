import { TaskPriority } from '../enum';

/**
 * 检查日期是否有效
 * @param dateString 日期字符串，格式：YYYY-MM-DD
 * @returns 是否为有效日期
 */
export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  const timestamp = date.getTime();
  
  if (isNaN(timestamp)) {
    return false;
  }

  // 检查日期是否与输入字符串完全匹配（避免 2026-02-31 被自动转换为 2026-03-02 的情况）
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return dateString === `${year}-${month}-${day}`;
};

/**
 * 获取月份的最后一天
 * @param year 年份
 * @param month 月份（1-12）
 * @returns 该月的最后一天（1-31）
 */
export const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

/**
 * 验证日期范围
 * @param startDate 开始日期字符串，格式：YYYY-MM-DD
 * @param endDate 结束日期字符串，格式：YYYY-MM-DD
 * @throws BadRequestException 如果日期无效或范围不正确
 */
export const validateDateRange = (startDate?: string, endDate?: string): void => {
  if (startDate || endDate) {
    if (startDate) {
      if (!isValidDate(startDate)) {
        throw new Error('startDate 不是有效的日期，请使用 YYYY-MM-DD 格式并确保日期存在');
      }
    }
    if (endDate) {
      if (!isValidDate(endDate)) {
        throw new Error('endDate 不是有效的日期，请使用 YYYY-MM-DD 格式并确保日期存在');
      }
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        throw new Error('startDate 不能晚于 endDate');
      }
    }
  }
};

export const getPriorityValue = ({ importance = 3, urgency = 3 }) => {
  if (importance === 4 && urgency === 4) {
    return TaskPriority.High;
  }
  if (importance === 3 && urgency === 3) {
    return TaskPriority.Low;
  }
  return TaskPriority.Medium;
};
