/**
 * 全站表格共享样式常量与工具函数（遵循 docs/前端页面风格规范与设计指南.md §5.3）。
 */

/** 标准暗色兼容斑马纹行类名 */
export function zebraRowClassName(_record: unknown, index: number): string {
  return index % 2 === 0
    ? 'bg-white dark:bg-slate-800'
    : 'bg-slate-50/70 dark:bg-slate-800/50'
}

/** 报表/统计表格汇总行统一底色（亮暗色可读） */
export const SUMMARY_ROW_CLASS_NAME = 'bg-slate-50 font-semibold dark:bg-slate-800/80'
