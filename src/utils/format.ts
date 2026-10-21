import dayjs from 'dayjs'

/**
 * 数字 / 日期格式化工具集
 *
 * 注意：jsdom 环境不支持 Intl.NumberFormat，单元测试中请 mock。
 */

/** 统一日期格式：2026-10-21 */
export const DATE_FORMAT = 'YYYY-MM-DD'
/** 统一日期时间格式：2026-10-21 14:03（列表展示不带秒） */
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm'
/** 带秒的日期时间格式：用于审计时间、日志等需要精确到秒的场景 */
export const DATETIME_SECONDS_FORMAT = 'YYYY-MM-DD HH:mm:ss'

type DateInput = string | number | Date | dayjs.Dayjs | null | undefined

function formatWith(value: DateInput, pattern: string, fallback: string) {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(pattern) : fallback
}

/** 格式化为日期：2026-10-21；空值/非法值返回 fallback */
export function formatDate(value: DateInput, fallback = '-') {
  return formatWith(value, DATE_FORMAT, fallback)
}

/**
 * 格式化为日期时间：2026-10-21 14:03；空值/非法值返回 fallback
 * 替代 `new Date(v).toLocaleString('zh-CN')`（2026/10/21 14:03:22，格式与其他页面不一致）
 */
export function formatDateTime(
  value: DateInput,
  { withSeconds = false, fallback = '-' }: { withSeconds?: boolean, fallback?: string } = {},
) {
  return formatWith(
    value,
    withSeconds ? DATETIME_SECONDS_FORMAT : DATETIME_FORMAT,
    fallback,
  )
}

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
