import type { Key } from 'react'
import type { TableSelection } from './tableSelectionContext'
import { use } from 'react'
import { TableSelectionContext } from './tableSelectionContext'

/** 切换单个行键的选中状态（用于键盘 Enter / Space 快捷切换，不覆盖既有勾选） */
export function toggleTableSelectionKey(keys: readonly Key[], key: Key): Key[] {
  const target = String(key)
  return keys.some(existing => String(existing) === target)
    ? keys.filter(existing => String(existing) !== target)
    : [...keys, key]
}

/** 读取当前页面的表格选中状态（需在 TableSelectionProvider 内使用） */
export function useTableSelection(): TableSelection {
  const context = use(TableSelectionContext)
  if (!context) {
    throw new Error('useTableSelection must be used within a TableSelectionProvider')
  }
  return context
}
