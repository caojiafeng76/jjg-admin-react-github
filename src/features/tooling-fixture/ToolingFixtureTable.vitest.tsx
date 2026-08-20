import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ToolingFixture } from '@/services/apiToolingFixture'
import ToolingFixtureTable from './ToolingFixtureTable'

const fixture: ToolingFixture = {
  id: 'fixture-001',
  fixture_no: 'JG-001',
  category: '夹具',
  applicable_product_drawing_no: 'DWG-001',
  product_name: '扶梯踏板',
  applicable_equipment: '冲床',
  storage_location: 'A-01',
  manufactured_date: '2026-01-01',
  manufacturer: '西尼',
  status: '使用中',
  lifecycle: '维修',
  last_maintenance_date: null,
  maintenance_cycle_days: 30,
  responsible_person: '张三',
  remarks: '',
  qr_token: 'qr-token-001',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-08-20T00:00:00.000Z',
}

function renderTable(data: ToolingFixture[]) {
  return render(
    <ConfigProvider>
      <ToolingFixtureTable
        loading={false}
        data={data}
        selectedRowKeys={[]}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onPrint={vi.fn()}
        page={1}
        pageSize={10}
      />
    </ConfigProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ToolingFixtureTable', () => {
  it('uses semantic pills for status and lifecycle values', () => {
    renderTable([fixture])

    expect(screen.getByText('使用中')).toHaveClass('bg-warning/10')
    expect(screen.getByText('维修')).toHaveClass('bg-warning/10')
  })

  it('shows a guided empty state when there are no fixtures', () => {
    renderTable([])

    expect(screen.getByText('暂无工装资料')).toBeInTheDocument()
    expect(
      screen.getByText('点击下方按钮创建第一条工装资料'),
    ).toBeInTheDocument()
  })

  it('renders a mobile fixture card with core fields and actions', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('max-width'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      })),
    )

    renderTable([fixture])

    const card = await waitFor(() =>
      screen.getByRole('article', { name: '工装资料 JG-001' }),
    )

    expect(card).toHaveTextContent('扶梯踏板')
    expect(card).toHaveTextContent('使用中')
    expect(card).toHaveTextContent('维修')
    expect(card).toHaveTextContent('打印')
    expect(card).toHaveTextContent('编辑')
    expect(card).toHaveTextContent('删除')
  })
})
