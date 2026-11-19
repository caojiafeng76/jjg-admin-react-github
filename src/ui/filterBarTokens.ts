/**
 * 搜索筛选栏控件标准宽度（遵循 docs/前端页面风格规范与设计指南.md §5.2）：
 * - short：短选择 / 状态 / 短编码（144px）
 * - medium：常规关键字 / 单号 / 姓名（208px）
 * - wide：日期区间 / 多字段模糊搜索（256px）
 */
export const FILTER_INPUT_WIDTH_CLASSES = {
  short: 'w-36',
  medium: 'w-52',
  wide: 'w-64',
} as const
