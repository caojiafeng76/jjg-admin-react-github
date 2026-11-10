import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import InventoryPage from '../Inventory'
import StockInPage from '../StockIn'
import StockOutPage from '../StockOut'

const auth = vi.hoisted(() => ({ role: 'employee' as string }))

vi.mock('@/contexts/useAuth', () => ({ useAuth: () => ({ role: auth.role }) }))
vi.mock('./SyneyMaterialsMobileStockPage', () => ({
  default: ({ direction }: { direction: string }) => <div>手机{direction}</div>,
}))
vi.mock('./SyneyMaterialsMobileInventoryPage', () => ({
  default: () => <div>手机库存</div>,
}))
vi.mock('../Stock/SyneyMaterialsStockPage', () => ({
  default: ({ direction }: { direction: string }) => <div>PC{direction}</div>,
}))
vi.mock('../Inventory/SyneyMaterialsInventoryPcPage', () => ({
  default: () => <div>PC库存</div>,
}))

afterEach(cleanup)

describe('西尼材料页面按角色切换手机版', () => {
  it.each(['employee', 'team_leader'])('%s 看到手机版', (role) => {
    auth.role = role
    render(<><StockInPage /><StockOutPage /><InventoryPage /></>)
    expect(screen.getByText('手机in')).toBeInTheDocument()
    expect(screen.getByText('手机out')).toBeInTheDocument()
    expect(screen.getByText('手机库存')).toBeInTheDocument()
  })

  it.each(['admin', 'warehouse_admin'])('%s 看到 PC 版', (role) => {
    auth.role = role
    render(<><StockInPage /><StockOutPage /><InventoryPage /></>)
    expect(screen.getByText('PCin')).toBeInTheDocument()
    expect(screen.getByText('PCout')).toBeInTheDocument()
    expect(screen.getByText('PC库存')).toBeInTheDocument()
  })
})
