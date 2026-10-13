import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import MobileProductionOrderScanPage from './MobileProductionOrderScanPage'

const mocks = vi.hoisted(() => ({
  role: 'employee' as string,
  message: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
  updateProductionOrderItem: vi.fn(),
  addProductionOrderItem: vi.fn(),
  getEmployeeOrderByDate: vi.fn(),
  createProductionOrder: vi.fn(),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  return {
    ...actual,
    App: { ...actual.App, useApp: () => ({ message: mocks.message }) },
  }
})

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({
    role: mocks.role,
    employeeProfile: { id: 'emp1', name: '张三' },
  }),
}))

vi.mock('@/services/apiProductionOrders', () => ({
  createProductionOrder: mocks.createProductionOrder,
  getEmployeeOrderByDate: mocks.getEmployeeOrderByDate,
}))

vi.mock('@/services/apiProductionOrderItems', () => ({
  addProductionOrderItem: mocks.addProductionOrderItem,
  updateProductionOrderItem: mocks.updateProductionOrderItem,
}))

vi.mock('./useProcessStandards', () => ({
  useSalesOrdersProjectNos: () => ({
    data: [
      {
        project_no: 'P001',
        product_model: 'M1',
        length_mm: 1200,
        customer_model: 'C1',
      },
    ],
  }),
  useOperationsByModel: () => ({
    data: {
      matchLevel: 'type-a',
      records: [
        {
          operation: '精切',
          record_type: 'A',
          part_no: '',
          standard_seconds: 12,
          theoretical_seconds: 10,
        },
      ],
    },
  }),
}))

vi.mock('./useMachineEquipmentOptions', () => ({
  useMachineEquipmentOptions: () => ({ data: [] }),
}))

vi.mock('./ProjectNoScanButton', () => ({ default: () => null }))

vi.mock('@/ui/mobile/MobileBottomSelectSheet', () => ({
  default: ({
    open,
    options,
    onSelect,
    onClose,
  }: {
    open: boolean
    options: Array<{ value: string; label: string }>
    onSelect: (value: string) => void
    onClose: () => void
  }) =>
    open ? (
      <div>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onSelect(option.value)
              onClose()
            }}
          >
            选项:{option.label}
          </button>
        ))}
      </div>
    ) : null,
}))

const EDITING_ITEM = {
  id: 'item1',
  project_no: 'P001',
  product_model: 'M1',
  length_mm: 1200,
  customer_model: 'C1',
  operation: '精切',
  machine_equipment_id: 'm1',
  incoming_qualified_quantity: 10,
  qualified_quantity: 8,
  defect_quantity_1: 1,
  defect_quantity_2: 1,
  outsource_defect_quantity: 0,
  outsource_defect_reason: null,
  outsource_unit: null,
  setup_defect_quantity: 0,
  setup_responsible: null,
  remark: '原备注',
}

function renderPage(state?: Record<string, unknown>) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[{ pathname: '/scan', state }]}>
        <Routes>
          <Route path="/scan" element={<MobileProductionOrderScanPage />} />
          <Route path="/back" element={<div>已返回</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MobileProductionOrderScanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.role = 'employee'
  })

  afterEach(() => {
    cleanup()
  })

  it('非员工端账号显示不可使用提示', () => {
    mocks.role = 'admin'
    renderPage()

    expect(screen.getByText('当前账号不可使用扫码录入')).toBeTruthy()
  })

  it('编辑模式带出原明细，保存后调用更新并返回', async () => {
    const user = userEvent.setup()
    mocks.updateProductionOrderItem.mockResolvedValue(undefined)
    renderPage({ editingItem: EDITING_ITEM, returnTo: '/back' })

    expect(screen.getByText('编辑工序明细')).toBeTruthy()
    expect(screen.getByText('P001')).toBeTruthy()
    expect(screen.getByDisplayValue('原备注')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /保存工序明细/ }))

    await waitFor(() =>
      expect(mocks.updateProductionOrderItem).toHaveBeenCalledWith({
        id: 'item1',
        values: expect.objectContaining({
          project_no: 'P001',
          operation: '精切',
          machine_equipment_id: 'm1',
          incoming_qualified_quantity: 10,
          qualified_quantity: 8,
          standard_seconds: 12,
          remark: '原备注',
        }),
      }),
    )
    expect(mocks.message.success).toHaveBeenCalledWith('工序明细已更新')
    expect(await screen.findByText('已返回')).toBeTruthy()
  })

  it('新建时依次校验项目号、工序、机器与来料数量', async () => {
    const user = userEvent.setup()
    renderPage()

    const submit = screen.getByRole('button', { name: /提交工序明细/ })

    await user.click(submit)
    expect(mocks.message.error).toHaveBeenLastCalledWith('请选择项目号')

    await user.click(screen.getByRole('button', { name: /请选择项目号/ }))
    await user.click(screen.getByRole('button', { name: '选项:P001' }))
    await user.click(submit)
    expect(mocks.message.error).toHaveBeenLastCalledWith('请选择工序')

    await user.click(screen.getByRole('button', { name: /请选择工序/ }))
    await user.click(screen.getByRole('button', { name: '选项:精切' }))
    await user.click(submit)
    expect(mocks.message.error).toHaveBeenLastCalledWith('请选择机器编号')

    await user.click(screen.getByRole('button', { name: /请选择机器编号/ }))
    await user.click(screen.getByRole('button', { name: '选项:无' }))

    const [, qualifiedInput] = screen.getAllByRole('spinbutton')
    await user.type(qualifiedInput, '5')
    await user.click(submit)
    expect(mocks.message.error).toHaveBeenLastCalledWith(
      '来料接收数不能小于成品合格数与不良数之和',
    )
    expect(mocks.addProductionOrderItem).not.toHaveBeenCalled()
  })
})
