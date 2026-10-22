import type { Key, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { TableSelectionContext } from './tableSelectionContext'

export interface TableSelectionProviderProps {
  children: ReactNode
  /** 初始选中项（测试用） */
  initialSelectedKeys?: Key[]
}

/**
 * 西尼页面的表格选中状态（每个页面实例独立）。
 *
 * 原先放在全局 zustand store 中，多标签页缓存（Activity）下订单列表、对账单列表、
 * 两个详情页共用同一份选中项，会互相串；现在由各页面根组件提供，各标签页互不影响。
 */
export default function TableSelectionProvider({
  children,
  initialSelectedKeys = [],
}: TableSelectionProviderProps) {
  const [tableSelectedKeys, setTableSelectedKeys]
    = useState<Key[]>(initialSelectedKeys)

  const value = useMemo(
    () => ({ tableSelectedKeys, setTableSelectedKeys }),
    [tableSelectedKeys],
  )

  return <TableSelectionContext value={value}>{children}</TableSelectionContext>
}
