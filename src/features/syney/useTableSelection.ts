import type { TableSelection } from './tableSelectionContext'
import { use } from 'react'
import { TableSelectionContext } from './tableSelectionContext'

/** 读取当前页面的表格选中状态（需在 TableSelectionProvider 内使用） */
export function useTableSelection(): TableSelection {
  const context = use(TableSelectionContext)
  if (!context) {
    throw new Error('useTableSelection must be used within a TableSelectionProvider')
  }
  return context
}
