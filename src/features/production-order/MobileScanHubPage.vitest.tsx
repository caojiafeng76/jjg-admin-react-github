import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MobileScanHubPage from './MobileScanHubPage'

const granted = vi.hoisted(() => ({ keys: new Set<string>() }))

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({ role: 'employee', employeeProfile: { id: 'emp-1' } }),
}))
vi.mock('@/hooks/usePermission', () => ({
  usePermission: (key: string) => granted.keys.has(key),
}))
vi.mock('./useProcessStandards', () => ({
  useSalesOrdersProjectNos: () => ({ data: [] }),
}))
vi.mock('./ProjectNoScanButton', () => ({ default: () => null }))

function renderHub() {
  return render(
    <MemoryRouter initialEntries={['/scan']}>
      <Routes>
        <Route path="/scan" element={<MobileScanHubPage />} />
        <Route path="/syney-materials-stock-out" element={<div>出库页</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  granted.keys = new Set()
})

describe('扫码页西尼材料入口', () => {
  it('三个权限都有时显示 材料入库 / 材料出库 / 查库存', () => {
    granted.keys = new Set([
      'page:syney-materials-stock-in',
      'page:syney-materials-stock-out',
      'page:syney-materials-inventory',
    ])
    renderHub()

    expect(screen.getByText('西尼材料')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '材料入库' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '材料出库' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查库存' })).toBeInTheDocument()
  })

  it('只显示有权限的入口，点击进入对应页面', () => {
    granted.keys = new Set(['page:syney-materials-stock-out'])
    renderHub()

    expect(screen.queryByRole('button', { name: '材料入库' })).toBeNull()
    expect(screen.queryByRole('button', { name: '查库存' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '材料出库' }))
    expect(screen.getByText('出库页')).toBeInTheDocument()
  })

  it('没有任何西尼材料权限时整个分组不显示', () => {
    renderHub()
    expect(screen.queryByText('西尼材料')).toBeNull()
    expect(screen.getByText('物料转移')).toBeInTheDocument()
  })
})
