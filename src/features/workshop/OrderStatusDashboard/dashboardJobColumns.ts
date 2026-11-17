import type { OrderStatusJobColumn } from '@/services/apiOrderStatusDashboard'

const JOB_OUTPUT_COLUMN_ORDER = [
  '精切',
  '自动切',
  'CNC',
  '冲床',
  '钻床',
  '端铣',
  '攻丝',
  '滚弯',
  '折弯',
  '焊接',
  '塑封',
  '去毛刺',
  '整形',
  '检验',
  '组装',
  '包装',
] as const
const JOB_OUTPUT_COLUMN_ORDER_MAP: ReadonlyMap<string, number> = new Map([
  ...JOB_OUTPUT_COLUMN_ORDER.map((jobName, index) => [jobName, index] as const),
  ['切割', 1],
])

export function getDashboardJobColumns(jobColumns: readonly OrderStatusJobColumn[]): OrderStatusJobColumn[] {
  return jobColumns.filter(column => column.key !== '精切').sort((left, right) => {
    const leftOrder = JOB_OUTPUT_COLUMN_ORDER_MAP.get(left.key) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = JOB_OUTPUT_COLUMN_ORDER_MAP.get(right.key) ?? Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder || left.title.localeCompare(right.title, 'zh-Hans-CN')
  })
}
