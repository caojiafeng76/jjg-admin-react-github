/** 下拉、只读输入框里展示一条材料：型号 / 客户型号 / 规格（类别） */
export function formatWorkshopMiscMaterialLabel(row: {
  model: string
  customer_model?: string
  specification?: string
  category?: string
}): string {
  const parts = [
    row.model,
    row.customer_model || '无客户型号',
    row.specification || '无规格',
  ]
  const category = row.category ? `（${row.category}）` : ''
  return `${parts.join(' / ')}${category}`
}

export function renderText(value: string | null | undefined) {
  return value || '-'
}

export function formatQuantity(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('zh-CN')
}

export function formatSignedQuantity(value: number | null | undefined) {
  const num = Number(value ?? 0)
  const text = num.toLocaleString('zh-CN')
  return num > 0 ? `+${text}` : text
}
