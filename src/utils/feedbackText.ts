/**
 * 统一的操作反馈文案模板（规范见 docs/前端交互与反馈规范.md §反馈）
 *
 * 句式：对象 + 动作 + 结果
 * - 成功：「工装创建成功」「已删除 3 条入库记录」
 * - 失败：「工装创建失败：原因」，原因缺失时补「请稍后重试」
 *
 * 选择/前置条件不满足的提示用 message.warning，不用 message.error。
 */

const RETRY_SUFFIX = '请稍后重试'

export const feedbackText = {
  created: (entity: string) => `${entity}创建成功`,
  updated: (entity: string) => `${entity}更新成功`,
  saved: (entity: string) => `${entity}保存成功`,
  deleted: (entity: string, count?: number) =>
    count && count > 1 ? `已删除 ${count} 条${entity}` : `${entity}删除成功`,
  exported: (entity: string, count: number) => `已导出 ${count} 条${entity}`,
  imported: (entity: string, count: number) => `已导入 ${count} 条${entity}`,
  /** 批量动作，如 batch('审核', '工单', 3) → 「已审核 3 条工单」 */
  batch: (action: string, entity: string, count: number) =>
    `已${action} ${count} 条${entity}`,
  /** 失败，如 failed('删除', '工单', reason) → 「工单删除失败：reason」 */
  failed: (action: string, entity: string, reason?: string) =>
    `${entity}${action}失败：${reason || RETRY_SUFFIX}`,
  /** 未选择数据时的提示（配合 message.warning） */
  selectRequired: (action = '操作') => `请先选择要${action}的数据`,
} as const
