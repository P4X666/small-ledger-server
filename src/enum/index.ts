export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export enum TaskPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum TaskTimePeriod {
  Week = 'week',
  Month = 'month',
  Year = 'year',
}

export enum PayType {
  Alipay = 'alipay',
  WechatPay = 'wechat_pay',
}

export enum BillCategory {
  Income = 'income',
  Expense = 'expense',
  Neutral = 'neutral',
}

export enum SavingsGoalStatus {
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
}

export enum SavingsGoalPeriod {
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  HalfYearly = 'half_yearly',
  Yearly = 'yearly',
}
