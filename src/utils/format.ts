/**
 * 数字格式化工具集
 *
 * 注意：jsdom 环境不支持 Intl.NumberFormat，单元测试中请 mock。
 */

/**
 * 将数字格式化为固定小数位的字符串。
 * - null/undefined/NaN → 返回 fallback
 * - 有效数字 → 返回 toFixed(digits) 结果
 *
 * @param value - 输入值
 * @param digits - 小数位数，默认 2
 * @param fallback - 空值时的返回值，默认 '-'
 */
export function formatNumber(
  value: number | null | undefined,
  digits = 2,
  fallback = '-',
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback
  }

  return Number(value).toFixed(digits)
}
