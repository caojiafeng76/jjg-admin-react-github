/** 下拉、只读输入框里展示一条材料：品名 / 规格（单位） */
export function formatSyneyMaterialLabel(row: {
  material_name: string
  specification: string
  unit?: string
}): string {
  const unit = row.unit ? `（${row.unit}）` : ''
  return `${row.material_name} / ${row.specification || '无规格'}${unit}`
}

export function renderText(value: string | null | undefined) {
  return value || '-'
}

export function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

export function zebraRowClassName(_record: unknown, index: number) {
  return index % 2 === 0
    ? 'bg-white dark:bg-slate-800'
    : 'bg-slate-50/60 dark:bg-slate-800/60'
}
