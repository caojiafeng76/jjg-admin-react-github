import type { Key } from 'react'
import { createContext } from 'react'

export interface TableSelection {
  tableSelectedKeys: Key[]
  setTableSelectedKeys: (keys: Key[]) => void
}

export const TableSelectionContext = createContext<TableSelection | null>(null)
