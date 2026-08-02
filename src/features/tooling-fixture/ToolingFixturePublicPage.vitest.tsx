import { render, screen } from '@testing-library/react'
import { App } from 'antd'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { PublicToolingFixture } from '@/services/apiToolingFixturePublic'

import ToolingFixturePublicPage from './ToolingFixturePublicPage'

vi.mock('./useToolingFixtures', () => ({
  usePublicToolingFixture: () => ({
    data: {
      id: 'fixture-001',
      fixture_no: 'FIXTURE-2026-001',
      category: '冲压模具',
      applicable_product_drawing_no: 'DWG-2026-001',
      product_name: '扶梯踏板',
      applicable_equipment: 'A01 冲压机',
      storage_location: '工装库 A-01',
      manufactured_date: '2026-01-01',
      manufacturer: '西尼工装厂',
      last_maintenance_date: '2026-07-01',
      maintenance_cycle_days: 30,
      responsible_person: '张三',
      remarks: '备注',
      status: '未使用',
    } satisfies PublicToolingFixture,
    isLoading: false,
    isError: false,
  }),
  useRecordPublicToolingFixtureAction: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}))

describe('ToolingFixturePublicPage', () => {
  it('uses an independent viewport scroll container for the H5 fixture page', () => {
    render(
      <App>
        <MemoryRouter initialEntries={['/h5/tooling-fixture/test-token']}>
          <Routes>
            <Route
              path="/h5/tooling-fixture/:qrToken"
              element={<ToolingFixturePublicPage />}
            />
          </Routes>
        </MemoryRouter>
      </App>,
    )

    expect(screen.getByRole('main')).toHaveClass(
      'min-h-0',
      'flex-1',
      'overflow-y-auto',
    )
  })
})
