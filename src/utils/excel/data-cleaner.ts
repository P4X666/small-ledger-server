// 正则预编译
const REGEX_CONTROL_CHARS = /[\x00-\x1F\x7F\u200B-\u200D\uFEFF]/g;
const REGEX_GARBLED = /[\ufffd]/g;
const REGEX_VALID_CHARS = /[\u4e00-\u9fa5a-zA-Z0-9]/;
const REGEX_VALID_CHARS_MULTIPLE = /[\u4e00-\u9fa5a-zA-Z0-9]{2,}/;
const REGEX_AMOUNT_CLEAN = /[\x00-\x1F\x7F]/g;

/**
 * 清理字符串中的乱码和控制字符
 * @param str 要清理的字符串
 * @returns 清理后的字符串
 */
export function cleanString(str: string): string {
  // 1. 基础清理：控制字符、零宽度字符
  let cleaned = str.replace(REGEX_CONTROL_CHARS, '').trim();

  // 2. 空值处理
  if (!cleaned) return '';

  // 3. 乱码字符清理（仅移除乱码，保留其他字符）
  cleaned = cleaned.replace(REGEX_GARBLED, '');

  // 4. 合理短内容保留（如"123-"、"AB&C"）
  if (cleaned.length < 5) {
    // 仅当无有效字符时替换
    if (!REGEX_VALID_CHARS.test(cleaned)) {
      return '';
    }
    return cleaned;
  }

  // 5. 保留合法内容（中文/字母数字/常见符号）
  if (REGEX_VALID_CHARS_MULTIPLE.test(cleaned)) {
    return cleaned;
  }

  return '';
}

/**
 * 检查字段是否为金额字段
 * @param key 字段名
 * @param amountFieldKeywords 金额字段关键词数组
 * @returns 是否为金额字段
 */
export function isAmountField(
  key: string,
  amountFieldKeywords: string[],
): boolean {
  const lowerKey = key.toLowerCase();
  return amountFieldKeywords.some((kw) => lowerKey.includes(kw.toLowerCase()));
}

/**
 * 清理数据对象中的乱码和控制字符
 * @param data 要清理的数据对象
 * @param amountFieldKeywords 金额字段关键词数组
 * @returns 清理后的数据对象
 */
export function cleanData(data: any, amountFieldKeywords: string[]): any {
  const cleanedData: any = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      let value = data[key];
      if (typeof value === 'string') {
        // 仅非金额字段清理乱码
        if (!isAmountField(key, amountFieldKeywords)) {
          value = cleanString(value);
        }
        // 通用清理：控制字符（金额字段也需要）
        value = value.replace(REGEX_AMOUNT_CLEAN, '');
      } else if (value === undefined || value === null) {
        value = '';
      }
      cleanedData[key] = value;
    }
  }

  return cleanedData;
}
